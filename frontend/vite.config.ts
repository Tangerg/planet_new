/// <reference types="vitest/config" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  /* —— 路径别名（与 tsconfig.app.json 的 paths 字段保持一致） —— *
   *   @kernel/*  → src/packages/*  框架无关内核
   *   @/*        → src/view/*      React UI 层 */
  resolve: {
    alias: {
      "@kernel": "/src/packages",
      "@": "/src/view",
    },
  },

  plugins: [
    tailwindcss(),
    react(),
    tanstackRouter({
      target: "react",
      routesDirectory: "./src/view/pages",
      generatedRouteTree: "./src/view/route.tsx",
    }),
  ],

  test: {
    dir: "./src",
    watch: false,
    environment: "jsdom",
    setupFiles: ["./test-setup.ts"],
    coverage: {
      enabled: true,
      provider: "istanbul",
      include: ["src/**/*"],
    },
    typecheck: { enabled: true },
    restoreMocks: true,
  },
});
