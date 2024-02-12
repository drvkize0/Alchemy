import React from "react";
import ReactDOM from "react-dom";
import NodeTemplatePanel from "./NodeTemplatePanel";

import './index_node_template_view.css';

ReactDOM.render(
    <React.StrictMode>
        <NodeTemplatePanel />
    </React.StrictMode>,
    document.getElementById("node_template_view")
);