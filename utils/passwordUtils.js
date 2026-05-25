import crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt);
const HASH_PREFIX = 'scrypt';
const KEY_LENGTH = 64;
const TOKEN_BYTES = 32;

function bufferIgual(a, b) {
    if (a.length !== b.length) {
        return false;
    }

    return crypto.timingSafeEqual(a, b);
}

function senhaTemHash(senha) {
    return String(senha || '').startsWith(`${HASH_PREFIX}$`);
}

async function gerarHashSenha(senha) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = await scrypt(String(senha || ''), salt, KEY_LENGTH);

    return `${HASH_PREFIX}$${salt}$${hash.toString('hex')}`;
}

async function verificarSenha(senhaInformada, senhaSalva) {
    const senhaSalvaTexto = String(senhaSalva || '');

    if (!senhaTemHash(senhaSalvaTexto)) {
        return {
            valida: senhaSalvaTexto === String(senhaInformada || ''),
            precisaAtualizarHash: senhaSalvaTexto === String(senhaInformada || '')
        };
    }

    const [, salt, hashSalvo] = senhaSalvaTexto.split('$');

    if (!salt || !hashSalvo) {
        return { valida: false, precisaAtualizarHash: false };
    }

    const hashInformado = await scrypt(String(senhaInformada || ''), salt, KEY_LENGTH);
    const hashSalvoBuffer = Buffer.from(hashSalvo, 'hex');

    return {
        valida: bufferIgual(hashInformado, hashSalvoBuffer),
        precisaAtualizarHash: false
    };
}

function gerarTokenRecuperacao() {
    return crypto.randomBytes(TOKEN_BYTES).toString('hex');
}

function gerarHashToken(token) {
    return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

export {
    gerarHashSenha,
    verificarSenha,
    senhaTemHash,
    gerarTokenRecuperacao,
    gerarHashToken
};
