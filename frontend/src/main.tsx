import { createRoot } from "react-dom/client";
import React from "react";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { engine } from "./app/planet";
import { EngineProvider } from "@/hooks/engineProvider";
import Shell from "@/vibe/Shell";

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

root.render(
  <React.StrictMode>
    <EngineProvider engine={engine}>
      <QueryClientProvider client={queryClient}>
        <Shell />
      </QueryClientProvider>
    </EngineProvider>
  </React.StrictMode>,
);
