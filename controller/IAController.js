import Produto from '../models/Produto.js';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';
const categoriasPermitidas = ['Dor e febre', 'Gripe', 'Vitaminas', 'Primeiros socorros', 'Higiene', 'Geral'];

const perguntasSeguranca = [
    'Voce tem alergia a algum medicamento?',
    'Esta gravida, amamentando ou comprando para crianca?',
    'Usa algum medicamento continuo ou tem problema no figado, rins, estomago ou pressao?',
    'Os sintomas sao leves ou existem sinais como falta de ar, dor no peito, desmaio ou febre alta?'
];

function normalizar(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function categoriaDoProduto(produto) {
    if (produto.categoria && produto.categoria !== 'Geral') {
        return produto.categoria;
    }

    const texto = normalizar(`${produto.nome || ''} ${produto.descricao || ''}`);

    if (
        texto.includes('tadalafila') ||
        texto.includes('sildenafila') ||
        texto.includes('erecao') ||
        texto.includes('ereto')
    ) {
        return 'Geral';
    }

    if (texto.includes('gripe') || texto.includes('tosse') || texto.includes('resfriado')) {
        return 'Gripe';
    }

    if (
        texto.includes('novalgina') ||
        texto.includes('dipirona') ||
        texto.includes('paracetamol') ||
        texto.includes('ibuprofeno') ||
        texto.includes('dorflex') ||
        texto.includes('dor de cabeca') ||
        texto.includes('febre')
    ) {
        return 'Dor e febre';
    }

    if (texto.includes('vitamina') || texto.includes('suplemento')) {
        return 'Vitaminas';
    }

    if (texto.includes('curativo') || texto.includes('gaze') || texto.includes('alcool')) {
        return 'Primeiros socorros';
    }

    if (texto.includes('shampoo') || texto.includes('sabonete') || texto.includes('higiene')) {
        return 'Higiene';
    }

    return 'Geral';
}

function limparCategorias(categorias) {
    const categoriasRecebidas = Array.isArray(categorias) ? categorias : [];
    const categoriasValidas = categoriasRecebidas.filter((categoria) => {
        return categoriasPermitidas.includes(categoria);
    });

    return categoriasValidas.length ? categoriasValidas : ['Geral'];
}

function extrairJson(texto) {
    const conteudo = String(texto || '').trim();

    try {
        return JSON.parse(conteudo);
    } catch {
        const inicio = conteudo.indexOf('{');
        const fim = conteudo.lastIndexOf('}');

        if (inicio >= 0 && fim > inicio) {
            return JSON.parse(conteudo.slice(inicio, fim + 1));
        }

        throw new Error('OLLAMA_JSON_INVALIDO');
    }
}

function montarPromptUsuario(mensagem) {
    return [
        'Mensagem do cliente:',
        mensagem,
        '',
        'Categorias disponiveis no catalogo:',
        categoriasPermitidas.join(', '),
        '',
        'Responda somente em JSON valido no seguinte formato:',
        '{',
        '  "resposta": "texto curto em portugues do Brasil",',
        '  "risco": "baixo ou alto",',
        '  "categorias": ["uma ou mais categorias disponiveis"],',
        '  "alertas": ["sinais de alerta encontrados"],',
        '  "orientacoes": ["orientacoes curtas e seguras"],',
        '  "perguntasSeguranca": ["perguntas importantes antes de comprar"]',
        '}'
    ].join('\n');
}

async function analisarComOllama(mensagem) {
    const resposta = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            stream: false,
            format: 'json',
            messages: [
                {
                    role: 'system',
                    content: [
                        'Voce e um assistente generativo de triagem inicial para uma farmacia online.',
                        'Nao faca diagnostico, nao prometa cura e nao prescreva medicamentos controlados.',
                        'Se houver sinais graves como falta de ar, dor no peito, desmaio, convulsao, febre alta persistente, rigidez na nuca, gravidez, bebe ou alergia grave, marque risco como alto e recomende atendimento medico/farmaceutico.',
                        'Use apenas as categorias informadas pelo sistema.',
                        'Mantenha a resposta curta, clara e em portugues do Brasil.'
                    ].join(' ')
                },
                {
                    role: 'user',
                    content: montarPromptUsuario(mensagem)
                }
            ],
            options: {
                temperature: 0.2
            }
        })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
        console.error('Erro do Ollama:', dados);
        const error = new Error('OLLAMA_ERRO');
        error.status = resposta.status;
        throw error;
    }

    return extrairJson(dados.message?.content);
}

class IAController {
    static async analisarSintomas(req, res) {
        try {
            const { mensagem } = req.body;
            const mensagemNormalizada = normalizar(mensagem);

            if (!mensagemNormalizada || mensagemNormalizada.length < 4) {
                return res.status(400).json({
                    message: 'Descreva seus sintomas com um pouco mais de detalhe.'
                });
            }

            const analise = await analisarComOllama(mensagem);
            const categorias = limparCategorias(analise.categorias);

            const produtos = await Produto.findAll();
            const produtosSugeridos = produtos
                .filter((produto) => categorias.includes(categoriaDoProduto(produto)))
                .slice(0, 6);

            return res.json({
                resposta: analise.resposta,
                risco: analise.risco,
                categorias,
                alertas: Array.isArray(analise.alertas) ? analise.alertas : [],
                orientacoes: Array.isArray(analise.orientacoes) ? analise.orientacoes : [],
                perguntasSeguranca: Array.isArray(analise.perguntasSeguranca) && analise.perguntasSeguranca.length
                    ? analise.perguntasSeguranca
                    : perguntasSeguranca,
                produtosSugeridos
            });
        } catch (error) {
            console.error('Erro ao analisar sintomas com IA:', error);
            if (error.cause?.code === 'ECONNREFUSED' || error.message === 'fetch failed') {
                return res.status(503).json({
                    message: 'Ollama nao esta rodando. Abra o Ollama e confira OLLAMA_URL no arquivo .env.'
                });
            }

            return res.status(500).json({ message: 'Erro interno ao analisar sintomas' });
        }
    }
}

export default IAController;
