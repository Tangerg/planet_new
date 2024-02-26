import React from 'react'
import {createRoot} from 'react-dom/client'
import './style.css'
import App from './App'
import {NextUIProvider} from "@nextui-org/react";
import planet from "./planet";
planet.eventEmitter.on("ADDTRACK",(arg)=>{
    console.log("main")
    console.log(arg)
    console.log(arg?.id)
    console.log(arg?.name)
})
const container = document.getElementById('root')

const root = createRoot(container!)

root.render(
    <React.StrictMode>
        <NextUIProvider>
            <App/>
        </NextUIProvider>
    </React.StrictMode>
)
