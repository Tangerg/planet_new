import {createRoot} from "react-dom/client";
import React from "react";
import {NextUIProvider} from "@nextui-org/react";
import router from "./router";
import "./index.css"
import {RouterProvider} from "react-router-dom";

const container = document.getElementById('root')

const root = createRoot(container!)

root.render(
    <React.StrictMode>
        <NextUIProvider>
            <RouterProvider router={router} />
        </NextUIProvider>
    </React.StrictMode>
)
