import { createRoot } from "react-dom/client";
import React from "react";
import "./index.css";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./route";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import planet from "./planet";
import { PlanetProvider } from "./hooks/planetProvider";
import { TooltipProvider } from "./ui/tooltip";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);
const queryClient = new QueryClient();

root.render(
  <React.StrictMode>
    <PlanetProvider planet={planet}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={150}>
          <div className="dark">
            <RouterProvider router={router} />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </PlanetProvider>
  </React.StrictMode>,
);
