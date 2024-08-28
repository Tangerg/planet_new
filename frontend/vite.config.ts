/// <reference types="vitest/config" />

import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "tailwindcss"
import autoprefixer from "autoprefixer"
import {TanStackRouterVite} from "@tanstack/router-plugin/vite"
// https://vitejs.dev/config/
export default defineConfig({
    css: {
        postcss: {
            plugins: [
                tailwindcss,
                autoprefixer,
            ]
        }
    },
    plugins: [
        react(),
        TanStackRouterVite({
            routesDirectory: "./src/view/pages",
            generatedRouteTree: "./src/view/route.tsx",
        })
    ],
    test: {
        dir: './src',
        watch: false,
        environment: 'jsdom',
        setupFiles: ['./test-setup.ts'],
        coverage: {enabled: true, provider: 'istanbul', include: ['src/**/*']},
        typecheck: {enabled: true},
        restoreMocks: true,
    },
})
