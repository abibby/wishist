import { UserConfig, defineConfig, loadEnv } from 'vite'
import preact from '@preact/preset-vite'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'
import { Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig(({ mode }): UserConfig => {
    const env = {
        ...process.env,
        ...loadEnv(mode, resolve(__dirname, '..')),
    }
    const isProd = mode === 'production'

    return {
        plugins: [
            preact(),
            VitePWA({
                strategies: 'injectManifest',
                srcDir: 'src',
                filename: 'sw.ts',
                injectRegister: false,
                workbox: {
                    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                    sourcemap: true,
                },
                manifest: {
                    name: 'Wishist',
                    short_name: 'Wishist',
                    description: 'Wishlist app',
                    theme_color: '#31363f',
                    background_color: '#222831',
                    start_url: '/',
                    id: isProd ? 'ca.wishist' : 'ca.wishist.' + mode,
                    screenshots: [
                        {
                            label: 'Your Wishlist',
                            src: '/screenshots/mobile_list.png',
                            sizes: '750x1334',
                            form_factor: 'narrow',
                        },
                        {
                            label: 'Edit details',
                            src: '/screenshots/mobile_list_edit.png',
                            sizes: '750x1334',
                            form_factor: 'narrow',
                        },
                        {
                            label: 'Friends wishlist',
                            src: '/screenshots/mobile_list_friend.png',
                            sizes: '750x1334',
                            form_factor: 'narrow',
                        },
                        {
                            label: 'Friends wishlist view details',
                            src: '/screenshots/mobile_list_friend_details.png',
                            sizes: '750x1334',
                            form_factor: 'narrow',
                        },
                    ],
                },
                pwaAssets: {
                    preset: minimalPresetNoPadding,
                    image: resolve(__dirname, 'public/icon.svg'),
                    integration: {
                        outDir: resolve(__dirname, 'dist'),
                    },
                },
            }),
        ],
        server: {
            port: 12345,
            proxy: {
                '/api': env.VITE_PROXY_HOST ?? 'http://localhost:32148',
            },
        },
        build: {
            sourcemap: true,
        },
    }
})

export const minimalPresetNoPadding: Preset = {
    transparent: {
        sizes: [64, 192, 512],
        favicons: [[48, 'favicon.ico']],
        padding: 0,
    },
    maskable: {
        sizes: [512],
        padding: 0,
    },
    apple: {
        sizes: [180],
        padding: 0,
    },
}
