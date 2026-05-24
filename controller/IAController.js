import Produto from '../models/Produto.js';

const categoriasSintomas = [
    {
        categoria: 'Dor e febre',
        termos: ['dor', 'febre', 'enxaqueca', 'cabeca', 'cabeca', 'colica', 'mal estar', 'calafrio'],
        orientacao: 'Pode estar relacionado a dor ou febre. A IA pode indicar categorias de venda livre, mas a escolha deve considerar alergias, idade, doencas existentes e medicamentos em uso.'
    },
    {
        categoria: 'Gripe',
        termos: ['gripe', 'tosse', 'resfriado', 'nariz', 'coriza', 'garganta', 'espirro', 'congestao'],
        orientacao: 'Os sintomas lembram quadros respiratorios comuns. Hidratacao e repouso ajudam, mas febre persistente ou piora precisam de avaliacao profissional.'
    },
    {
        categoria: 'Primeiros socorros',
        termos: ['corte', 'ferida', 'machucado', 'queimadura', 'curativo', 'sangramento', 'arranhao'],
        orientacao: 'Pode ser um caso de cuidado local. Produtos de primeiros socorros podem ajudar, mas feridas profundas, queimaduras extensas ou sangramento importante precisam de atendimento.'
    },
    {
        categoria: 'Vitaminas',
        termos: ['cansaco', 'fraqueza', 'vitamina', 'imunidade', 'disposicao', 'suplemento'],
        orientacao: 'Cansaco e fraqueza podem ter muitas causas. Suplementos so fazem sentido quando ha necessidade real, preferencialmente com orientacao profissional.'
    },
    {
        categoria: 'Higiene',
        termos: ['higiene', 'pele', 'oleosidade', 'caspa', 'sabonete', 'shampoo', 'dermatite'],
        orientacao: 'Parece envolver cuidado de higiene ou pele. Produtos de cuidado pessoal podem ajudar, mas irritacoes intensas ou persistentes devem ser avaliadas.'
    }
];

const sinaisAlerta = [
    'falta de ar',
    'dor no peito',
    'desmaio',
    'convulsao',
    'sangramento intenso',
    'febre alta',
    'febre ha mais de 3 dias',
    'rigidez na nuca',
    'confusao',
    'gravida',
    'gravidez',
    'bebe',
    'crianca pequena',
    'alergia grave'
];

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

function identificarCategorias(mensagemNormalizada) {
    return categoriasSintomas.filter((grupo) => {
        return grupo.termos.some((termo) => mensagemNormalizada.includes(normalizar(termo)));
    });
}

function identificarAlertas(mensagemNormalizada) {
    return sinaisAlerta.filter((alerta) => mensagemNormalizada.includes(normalizar(alerta)));
}

function categoriaDoProduto(produto) {
    if (produto.categoria) {
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

            const alertasEncontrados = identificarAlertas(mensagemNormalizada);
            const categoriasEncontradas = identificarCategorias(mensagemNormalizada);
            const categorias = categoriasEncontradas.length
                ? categoriasEncontradas.map((grupo) => grupo.categoria)
                : ['Dor e febre'];

            const produtos = await Produto.findAll();
            const produtosSugeridos = produtos
                .filter((produto) => categorias.includes(categoriaDoProduto(produto)))
                .slice(0, 6);

            const risco = alertasEncontrados.length ? 'alto' : 'baixo';
            const orientacoes = categoriasEncontradas.map((grupo) => grupo.orientacao);
            const resposta = alertasEncontrados.length
                ? 'Encontrei sinais de alerta na sua descricao. Procure atendimento medico ou um farmaceutico antes de comprar qualquer medicamento.'
                : 'Posso te orientar de forma inicial, mas nao faco diagnostico e nao substituo medico ou farmaceutico. Pelos sintomas informados, estas categorias podem ser relevantes.';

            return res.json({
                resposta,
                risco,
                categorias,
                alertas: alertasEncontrados,
                orientacoes: orientacoes.length ? orientacoes : [
                    'Nao consegui identificar uma categoria especifica. Se os sintomas persistirem ou piorarem, procure orientacao profissional.'
                ],
                perguntasSeguranca,
                produtosSugeridos
            });
        } catch (error) {
            console.error('Erro ao analisar sintomas com IA:', error);
            return res.status(500).json({ message: 'Erro interno ao analisar sintomas' });
        }
    }
}

export default IAController;
