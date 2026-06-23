import { createRoot } from "react-dom/client";
import React from "react";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { planet } from "./app/planet";
import { PlanetProvider } from "@/hooks/planetProvider";
import Shell from "@/vibe/Shell";

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);
const queryClient = new QueryClient();

root.render(
  <React.StrictMode>
    <PlanetProvider planet={planet}>
      <QueryClientProvider client={queryClient}>
        <Shell />
      </QueryClientProvider>
    </PlanetProvider>
  </React.StrictMode>,
);
