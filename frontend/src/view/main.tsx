import {createRoot} from "react-dom/client";
import React from "react";
import {FluentProvider, teamsDarkTheme} from '@fluentui/react-components';
import {darkTheme, lightTheme} from "./theme";
import router from "./router";
import "./index.css"
import {RouterProvider} from "react-router-dom";

const container = document.getElementById('root')

const root = createRoot(container!)

root.render(
    <React.StrictMode>
        <FluentProvider theme={darkTheme}>
            <RouterProvider router={router}/>
        </FluentProvider>
    </React.StrictMode>
)
