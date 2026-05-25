import Cliente from '../models/Cliente.js';
import Farmacia from '../models/Farmacia.js';
import {
    gerarHashSenha,
    verificarSenha,
    gerarTokenRecuperacao,
    gerarHashToken
} from '../utils/passwordUtils.js';

const CLIENTE_REDIRECT = process.env.CLIENTE_FRONTEND_URL || '/frontend/cliente';
const FARMACIA_REDIRECT = process.env.FARMACIA_FRONTEND_URL || '/frontend/farmacia';
const RESET_TOKEN_MINUTOS = 30;

function normalizarEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function removerSenha(usuario) {
    const objeto = usuario.toObject ? usuario.toObject() : usuario;
    const { senha, ...usuarioSemSenha } = objeto;
    return usuarioSemSenha;
}

function querHtml(req) {
    if (req.is('application/json')) {
        return false;
    }

    return req.accepts(['html', 'json']) === 'html';
}

function renderizarErroLogin(req, res, tipo, message, status = 400) {
    if (!querHtml(req)) {
        return res.status(status).json({ message });
    }

    const destino = tipo === 'farmacia' ? '/login/farmacia' : '/login/cliente';
    return res.redirect(`${destino}?erro=${encodeURIComponent(message)}`);
}

function responderErroCadastro(req, res, view, title, message, status = 400) {
    if (!querHtml(req)) {
        return res.status(status).json({ message });
    }

    const destino = view === 'cadastro-farmacia' ? '/cadastro/farmacia' : '/cadastro/cliente';
    return res.redirect(`${destino}?erro=${encodeURIComponent(message)}`);
}

function responderCadastro(req, res, usuario, tipo) {
    const redirectTo = tipo === 'farmacia' ? FARMACIA_REDIRECT : CLIENTE_REDIRECT;

    if (querHtml(req)) {
        return res.redirect(`/login/${tipo}?cadastro=sucesso`);
    }

    return res.status(201).json({
        message: `${tipo === 'farmacia' ? 'Farmacia' : 'Cliente'} cadastrado com sucesso`,
        tipo,
        usuario: removerSenha(usuario),
        redirectTo
    });
}

async function verificarEAtualizarSenhaLegada(usuario, senha, tipo) {
    const verificacao = await verificarSenha(senha, usuario?.senha);

    if (verificacao.valida && verificacao.precisaAtualizarHash) {
        const senhaHash = await gerarHashSenha(senha);
        const modelo = tipo === 'farmacia' ? Farmacia : Cliente;
        await modelo.update(usuario._id, { senha: senhaHash });
    }

    return verificacao.valida;
}

function modeloPorTipo(tipo) {
    return tipo === 'farmacia' ? Farmacia : Cliente;
}

function tipoValidoRecuperacao(tipo) {
    return tipo === 'farmacia' || tipo === 'cliente';
}

function responderRecuperacao(req, res, payload) {
    if (querHtml(req)) {
        return res.redirect('/recuperar-senha?enviado=sucesso');
    }

    return res.json(payload);
}

class AuthController {
    static renderLoginCliente(req, res) {
        return res.redirect('/login/cliente');
    }

    static renderLoginFarmacia(req, res) {
        return res.redirect('/login/farmacia');
    }

    static renderCadastroCliente(req, res) {
        return res.redirect('/cadastro/cliente');
    }

    static renderCadastroFarmacia(req, res) {
        return res.redirect('/cadastro/farmacia');
    }

    static async loginCliente(req, res) {
        req.body.tipoLogin = 'cliente';
        return AuthController.login(req, res);
    }

    static async loginFarmacia(req, res) {
        req.body.tipoLogin = 'farmacia';
        return AuthController.login(req, res);
    }

    static async login(req, res) {
        try {
            const email = normalizarEmail(req.body.email);
            const { senha, tipoLogin } = req.body;
            const tipoValido = tipoLogin === 'farmacia' || tipoLogin === 'cliente';
            const tipoTela = tipoLogin === 'farmacia' ? 'farmacia' : 'cliente';

            if (!tipoValido) {
                if (querHtml(req)) {
                    return res.redirect('/login');
                }

                return res.status(400).json({ message: 'Tipo de login invalido' });
            }

            if (!email || !senha) {
                if (querHtml(req)) {
                    return renderizarErroLogin(req, res, tipoTela, 'Informe email e senha.');
                }

                return res.status(400).json({ message: 'Informe email e senha' });
            }

            const tipo = tipoLogin;
            const usuario = tipo === 'farmacia'
                ? await Farmacia.findByEmail(email)
                : await Cliente.findByEmail(email);

            const senhaValida = usuario
                ? await verificarEAtualizarSenhaLegada(usuario, senha, tipo)
                : false;

            if (!usuario || !senhaValida) {
                const usuarioOutroTipo = tipo === 'farmacia'
                    ? await Cliente.findByEmail(email)
                    : await Farmacia.findByEmail(email);
                const senhaOutroTipoValida = usuarioOutroTipo
                    ? await verificarSenha(senha, usuarioOutroTipo.senha)
                    : { valida: false };

                if (usuarioOutroTipo && senhaOutroTipoValida.valida) {
                    const message = tipo === 'farmacia'
                        ? 'Essa conta esta cadastrada como cliente. Entre pela tela de login do cliente.'
                        : 'Essa conta esta cadastrada como farmacia. Entre pela tela de login da farmacia.';

                    if (querHtml(req)) {
                        return renderizarErroLogin(req, res, tipoTela, message, 401);
                    }

                    return res.status(401).json({ message });
                }

                if (querHtml(req)) {
                    return renderizarErroLogin(req, res, tipoTela, 'Email ou senha invalidos.', 401);
                }

                return res.status(401).json({ message: 'Email ou senha invalidos' });
            }

            const redirectTo = tipo === 'farmacia' ? FARMACIA_REDIRECT : CLIENTE_REDIRECT;

            if (querHtml(req)) {
                return res.redirect(`${redirectTo}?id=${usuario._id}`);
            }

            return res.json({
                message: 'Login realizado com sucesso',
                tipo,
                usuario: removerSenha(usuario),
                redirectTo
            });
        } catch (error) {
            console.error('Erro ao realizar login:', error);

            if (querHtml(req)) {
                const tipoTela = req.body.tipoLogin === 'farmacia' ? 'farmacia' : 'cliente';
                return renderizarErroLogin(req, res, tipoTela, 'Erro interno ao realizar login.', 500);
            }

            return res.status(500).json({ message: 'Erro interno ao realizar login' });
        }
    }

    static async cadastrarCliente(req, res) {
        try {
            const { nome, cpf, senha, telefone, endereco } = req.body;
            const email = normalizarEmail(req.body.email);

            const [clienteCpfExistente, clienteEmailExistente, farmaciaEmailExistente] = await Promise.all([
                Cliente.findByCpf(cpf),
                Cliente.findByEmail(email),
                Farmacia.findByEmail(email)
            ]);

            if (clienteCpfExistente) {
                return responderErroCadastro(req, res, 'cadastro-cliente', 'Cadastro do Cliente', 'Ja existe um cliente com esse CPF.');
            }

            if (clienteEmailExistente || farmaciaEmailExistente) {
                return responderErroCadastro(req, res, 'cadastro-cliente', 'Cadastro do Cliente', 'Ja existe uma conta cadastrada com esse email.');
            }

            const senhaHash = await gerarHashSenha(senha);
            const novoCliente = new Cliente(nome, cpf, email, senhaHash, telefone, endereco);
            const clienteSalvo = await novoCliente.save();
            return responderCadastro(req, res, clienteSalvo, 'cliente');
        } catch (error) {
            console.error('Erro ao cadastrar cliente pelo login:', error);
            return responderErroCadastro(req, res, 'cadastro-cliente', 'Cadastro do Cliente', 'Nao foi possivel cadastrar o cliente. Confira os dados informados.');
        }
    }

    static async cadastrarFarmacia(req, res) {
        try {
            const { nome, cnpj, senha, telefone, taxaEntrega, endereco } = req.body;
            const email = normalizarEmail(req.body.email);
            const aberta = req.body.aberta === 'true' || req.body.aberta === true;

            const [farmaciaCnpjExistente, farmaciaEmailExistente, clienteEmailExistente] = await Promise.all([
                Farmacia.findByCnpj(cnpj),
                Farmacia.findByEmail(email),
                Cliente.findByEmail(email)
            ]);

            if (farmaciaCnpjExistente) {
                return responderErroCadastro(req, res, 'cadastro-farmacia', 'Cadastro da Farmacia', 'Ja existe uma farmacia com esse CNPJ.');
            }

            if (farmaciaEmailExistente || clienteEmailExistente) {
                return responderErroCadastro(req, res, 'cadastro-farmacia', 'Cadastro da Farmacia', 'Ja existe uma conta cadastrada com esse email.');
            }

            const senhaHash = await gerarHashSenha(senha);
            const novaFarmacia = new Farmacia(nome, cnpj, email, senhaHash, telefone, Number(taxaEntrega), aberta, endereco);
            const farmaciaSalva = await novaFarmacia.save();
            return responderCadastro(req, res, farmaciaSalva, 'farmacia');
        } catch (error) {
            console.error('Erro ao cadastrar farmacia pelo login:', error);
            return responderErroCadastro(req, res, 'cadastro-farmacia', 'Cadastro da Farmacia', 'Nao foi possivel cadastrar a farmacia. Confira os dados informados.');
        }
    }

    static async solicitarRecuperacaoSenha(req, res) {
        try {
            const email = normalizarEmail(req.body.email);
            const tipo = req.body.tipoConta || req.body.tipoLogin || req.body.tipo;

            if (!email || !tipoValidoRecuperacao(tipo)) {
                return res.status(400).json({ message: 'Informe email e tipo de conta validos.' });
            }

            const modelo = modeloPorTipo(tipo);
            const usuario = await modelo.findByEmail(email);
            const message = 'Se houver uma conta com esse email, um link de recuperacao sera gerado.';

            if (!usuario) {
                return responderRecuperacao(req, res, { message });
            }

            const token = gerarTokenRecuperacao();
            const tokenHash = gerarHashToken(token);
            const expiraEm = new Date(Date.now() + RESET_TOKEN_MINUTOS * 60 * 1000);
            await modelo.definirTokenRecuperacao(usuario._id, tokenHash, expiraEm);

            const resetPath = `/redefinir-senha?tipo=${tipo}&token=${token}`;
            const resetLink = `${req.protocol}://${req.get('host')}${resetPath}`;

            return responderRecuperacao(req, res, {
                message,
                resetLink,
                expiraEm
            });
        } catch (error) {
            console.error('Erro ao solicitar recuperacao de senha:', error);
            return res.status(500).json({ message: 'Erro interno ao solicitar recuperacao de senha' });
        }
    }

    static async redefinirSenha(req, res) {
        try {
            const { token, senha } = req.body;
            const tipo = req.body.tipoConta || req.body.tipoLogin || req.body.tipo;

            if (!token || !senha || !tipoValidoRecuperacao(tipo)) {
                return res.status(400).json({ message: 'Token, tipo de conta e nova senha sao obrigatorios.' });
            }

            if (String(senha).length < 4) {
                return res.status(400).json({ message: 'A nova senha deve ter pelo menos 4 caracteres.' });
            }

            const modelo = modeloPorTipo(tipo);
            const tokenHash = gerarHashToken(token);
            const usuario = await modelo.findByResetSenhaTokenHash(tokenHash);

            if (!usuario) {
                return res.status(400).json({ message: 'Link de recuperacao invalido ou expirado.' });
            }

            const senhaHash = await gerarHashSenha(senha);
            await modelo.atualizarSenhaRecuperada(usuario._id, senhaHash);

            return res.json({ message: 'Senha redefinida com sucesso.' });
        } catch (error) {
            console.error('Erro ao redefinir senha:', error);
            return res.status(500).json({ message: 'Erro interno ao redefinir senha' });
        }
    }
}

export default AuthController;
