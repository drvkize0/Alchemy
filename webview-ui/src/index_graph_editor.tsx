import React from "react";
import ReactDOM from "react-dom";
import GraphEditorMain  from "./GraphEditorMain";

import './index_graph_editor.css';

ReactDOM.render(
    <React.StrictMode>
        <GraphEditorMain /> 
    </React.StrictMode>,
    document.getElementById("graph_editor")
);