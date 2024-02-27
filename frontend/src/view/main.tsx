import {createRoot} from "react-dom/client";
import React from "react";
import {NextUIProvider} from "@nextui-org/react";
import Layout from "./pages/layout";
import "./index.css"

const container = document.getElementById('root')

const root = createRoot(container!)

root.render(
    <React.StrictMode>
        <NextUIProvider>
            <Layout/>
        </NextUIProvider>
    </React.StrictMode>
)
