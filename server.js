import 'dotenv/config'; //ou import dotenv from 'dotenv'; dotenv.config(); ->depois de todas as importações
import express from 'express'
import path from 'path'
import __dirname from './utils/pathUtils.js'
import {
    staticMiddleware,
    urlencodedMiddleware,
    jsonMiddleware,
    securityMiddleware,
    compressionMiddleware,
    rateLimitMiddleware,
    morganMiddleware
} from './middlewares/middlewares.js'
import router from './routes/route.js';
import Database from './config/db.js';
//dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
Database.connect();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(staticMiddleware);
app.use(urlencodedMiddleware);
app.use(jsonMiddleware);
app.use(securityMiddleware);
app.use(compressionMiddleware);
app.use(rateLimitMiddleware);
app.use(morganMiddleware);
app.use(router);    
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
