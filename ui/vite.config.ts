import { defineConfig, loadEnv } from 'vite'
import preact from '@preact/preset-vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
    const env = {
        ...process.env,
        ...loadEnv(mode, resolve(process.cwd(), '..')),
    }

    return {
        plugins: [preact()],
        server: {
            port: 12345,
            proxy: {
                '/api': env.VITE_PROXY_HOST ?? 'http://localhost:32148',
            },
        },
    }
})
