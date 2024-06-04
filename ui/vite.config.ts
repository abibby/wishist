import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
    plugins: [preact()],
    // build: {
    //     minify: false,
    // },
    server: {
        port: 12345,
        proxy: {
            '/api': 'http://localhost:32148',
        },
    },
})
