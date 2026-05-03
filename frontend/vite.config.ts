/// <reference types="vitest/config" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
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
    coverage: { enabled: true, provider: "istanbul", include: ["src/**/*"] },
    typecheck: { enabled: true },
    restoreMocks: true,
  },
});
