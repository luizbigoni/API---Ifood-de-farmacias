import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    root: 'frontend',
    base: '/app/',
    plugins: [vue()],
    build: {
        outDir: '../assets/app',
        emptyOutDir: true
    },
    server: {
        proxy: {
            '/farmacias': 'http://localhost:3000',
            '/produtos': 'http://localhost:3000',
            '/clientes': 'http://localhost:3000',
            '/carrinhos': 'http://localhost:3000',
            '/login': 'http://localhost:3000',
            '/cadastro': 'http://localhost:3000',
            '/recuperar-senha': 'http://localhost:3000',
            '/redefinir-senha': 'http://localhost:3000',
            '/ia': 'http://localhost:3000'
        }
    }
});
