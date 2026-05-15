import express from 'express';
import __dirname from '../utils/pathUtils.js';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
const staticMiddleware = express.static(path.join(__dirname, 'assets'));
const urlencodedMiddleware = express.urlencoded({ extended: true });
const jsonMiddleware = express.json();
const securityMiddleware = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-eval'", "https://unpkg.com"],
            styleSrc: ["'self'"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: null
        }
    }
});
const compressionMiddleware = compression();
const rateLimitMiddleware = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 500, // Limite de 100 requisições por IP
    message: 'Muitas requisições, por favor tente novamente mais tarde.'
});
const logFile = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags:'a'});
const morganMiddleware = morgan('combined', { stream: logFile });
export {
    staticMiddleware,
    urlencodedMiddleware,
    jsonMiddleware,
    securityMiddleware,
    compressionMiddleware,
    rateLimitMiddleware,
    morganMiddleware
}
