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

import { engine } from "./app/planet";
import { EngineProvider } from "@/hooks/engineProvider";
import Shell from "@/Shell";
import { AccentProvider } from "@/hooks/accent";
import { installUiPerfProbe } from "@/infra/perf/uiPerfProbe";

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

installUiPerfProbe();

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
