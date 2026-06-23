/// <reference types="vitest/config" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  /* —— 路径别名(与 tsconfig.app.json 的 paths 一致) ——
   *   清晰架构分层:@shared(纯工具) ← @domain(实体+端口) ← @core(内核/运行时) ←
   *   @providers(数据源适配器);@(表现层 UI)在最外。 */
  resolve: {
    alias: {
      "@shared": "/src/shared",
      "@domain": "/src/domain",
      "@core": "/src/core",
      "@providers": "/src/providers",
      "@": "/src/ui",
    },
  },

  plugins: [tailwindcss(), react()],

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
