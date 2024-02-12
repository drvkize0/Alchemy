import React from "react";
import ReactDOM from "react-dom";
import ReactFlowProvider from "reactflow";
import GraphEditor  from "./GraphEditor";

import './index_graph_editor.css';

ReactDOM.render(
    <React.StrictMode>
        <GraphEditor /> 
    </React.StrictMode>,
    document.getElementById("graph_editor")
);