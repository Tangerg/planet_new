import {createRoot} from "react-dom/client";
import React from "react";
import {FluentProvider, teamsDarkTheme} from '@fluentui/react-components';
import {darkTheme, lightTheme} from "./theme";
import "./index.css"
import {RouterProvider, createRouter} from '@tanstack/react-router'
import {routeTree} from "./route"
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import planet from "./planet"
import {PlanetProvider} from "./hooks/planetProvider";

// Create a new router instance
const router = createRouter({routeTree})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}

const container = document.getElementById('root') as HTMLElement
const root = createRoot(container)
const queryClient = new QueryClient()

root.render(
    <React.StrictMode>
        <PlanetProvider planet={planet}>
            <QueryClientProvider client={queryClient}>
                <FluentProvider theme={darkTheme}>
                    <RouterProvider router={router}/>
                </FluentProvider>
            </QueryClientProvider>
        </PlanetProvider>
    </React.StrictMode>
)
