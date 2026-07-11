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
     *   清晰架构分层:@shared(纯工具) ← @domain(实体+端口) ← @core/@contexts ←
     *   @providers(数据源适配器);@(表现层 UI)在最外。 */
    resolve: {
      alias: {
        "@shared": "/src/shared",
        "@domain": "/src/domain",
        "@core": "/src/core",
        "@contexts": "/src/contexts",
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
        // Material color utilities ships extensionless internal ESM imports that
        // Node's strict resolver chokes on; pre-bundling with esbuild resolves them.
        "@material/material-color-utilities",
        "@base-ui/react/switch",
        "@base-ui/react/toggle",
        "@base-ui/react/toggle-group",
        "@base-ui/react/tooltip",
        "@base-ui/react/preview-card",
        "@base-ui/react/slider",
        "@base-ui/react/dialog",
        "@base-ui/react/menu",
      ],
    },

    /* Dev-server port. Defaults to Vite's 5173, but set VITE_DEV_PORT to run
     * alongside another Wails app that already holds 5173. strictPort is on only
     * when overridden, so the chosen port matches what `wails dev` is told via
     * -frontenddevserverurl (no silent auto-increment → no URL mismatch). */
    server: {
      port: Number(env.VITE_DEV_PORT) || 5173,
      strictPort: !!env.VITE_DEV_PORT,
      watch: {
        ignored: ["**/coverage/**"],
      },
    },

    build: {
      // The resident shell intentionally keeps every morph destination loaded;
      // a sourcemap audit measured the entry at 580 kB minified / 172 kB gzip.
      // Static splitting would keep the same preload graph, while lazy-loading
      // destinations would discard screen state. Keep a narrow measured budget.
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
            if (id.includes("node_modules/")) {
              if (id.includes("/react-dom/") || id.includes("/react/")) return "vendor-react";
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
      // Transform material-color-utilities through Vite instead of loading it via
      // Node ESM, which rejects the package's extensionless internal imports.
      server: { deps: { inline: [/@material\/material-color-utilities/] } },
      coverage: {
        enabled: true,
        provider: "istanbul",
        include: ["src/**/*"],
        thresholds: {
          "src/domain/**": { statements: 92, functions: 93, branches: 84, lines: 93 },
          "src/core/application/**": {
            statements: 64,
            functions: 57,
            branches: 70,
            lines: 64,
          },
          "src/providers/local/**": {
            statements: 92,
            functions: 92,
            branches: 90,
            lines: 92,
          },
          "src/contexts/local-library/**": {
            statements: 95,
            functions: 95,
            branches: 78,
            lines: 95,
          },
          "src/infrastructure/audio/**": {
            statements: 88,
            functions: 70,
            branches: 95,
            lines: 95,
          },
        },
      },
      typecheck: { enabled: true },
      restoreMocks: true,
    },
  };
});
