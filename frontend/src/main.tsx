import { createRoot } from "react-dom/client";
import React from "react";
import "./index.css";
import "@/styles/base.css";
import "@/styles/text.css";
import "@/components/cards/cards.css";
import "@/components/layout/SectionHead.css";
import "@/components/layout/CardRail.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "@/i18n"; // initialize i18next once (resources + active locale) before render

import { startPlanet } from "./app/planet";
import { EngineProvider } from "@/hooks/engineProvider";
import Shell from "@/Shell";
import { AccentProvider } from "@/hooks/accent";

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// The frame-timing probe is a development instrument. Imported dynamically
// behind the DEV flag so the whole module is dead-code-eliminated from the
// production bundle instead of shipping to users as unreachable weight.
if (import.meta.env.DEV) {
  void import("@/infra/perf/uiPerfProbe").then((probe) => probe.installUiPerfProbe());
}

// The kernel activates its plugin graph in dependency layers, so the Engine is
// only complete after an await. Rendering behind it keeps every component's
// "the Engine is live" assumption true instead of scattering null checks.
const engine = await startPlanet();

root.render(
  <React.StrictMode>
    <EngineProvider engine={engine}>
      <QueryClientProvider client={queryClient}>
        <AccentProvider>
          <Shell />
        </AccentProvider>
      </QueryClientProvider>
    </EngineProvider>
  </React.StrictMode>,
);
