/// <reference types="vitest/config" />

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  // Read env via Vite's loadEnv (no `process` → typechecks under the app
  // tsconfig). Empty prefix so OS vars like VITE_DEV_PORT are picked up too.
  const env = loadEnv(mode, ".", "");
  return {
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
        // Wails-generated Go bridge (outside src/). The `local` provider (infra
        // layer) is the only consumer — the desktop shell's on-device library.
        "@wailsjs": "/wailsjs",
      },
    },

    plugins: [tailwindcss(), react()],

    /* Pre-bundle the Base UI subpaths we use so Vite doesn't re-optimize (and
     * full-reload / occasionally 504) mid-session each time a new one is first
     * imported during the Radix → Base UI migration. Append here as more are
     * adopted. */
    optimizeDeps: {
      include: [
        "@base-ui/react/switch",
        "@base-ui/react/toggle",
        "@base-ui/react/toggle-group",
        "@base-ui/react/tooltip",
        "@base-ui/react/preview-card",
        "@base-ui/react/slider",
      ],
    },

    /* Dev-server port. Defaults to Vite's 5173, but set VITE_DEV_PORT to run
     * alongside another Wails app that already holds 5173. strictPort is on only
     * when overridden, so the chosen port matches what `wails dev` is told via
     * -frontenddevserverurl (no silent auto-increment → no URL mismatch). */
    server: {
      port: Number(env.VITE_DEV_PORT) || 5173,
      strictPort: !!env.VITE_DEV_PORT,
    },

    build: {
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
            if (id.includes("node_modules/")) {
              if (id.includes("/react-dom/") || id.includes("/react/")) return "vendor-react";
              if (id.includes("/@radix-ui/")) return "vendor-radix";
              if (id.includes("/@base-ui/")) return "vendor-baseui";
              if (id.includes("/@tanstack/")) return "vendor-tanstack";
              if (id.includes("/zustand/") || id.includes("/ky/")) return "vendor-state";
            }
          },
        },
      },
    },

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
  };
});
