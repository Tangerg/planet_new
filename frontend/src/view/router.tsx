import {createBrowserRouter} from "react-router-dom";
import Layout from "./pages/layout";
import Basic from "./layout/basic";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Basic/>,
    },
]);

export default router