import React from "react";
import ReactDOM from "react-dom";
import NodeTemplateMain from "./NodeTemplateMain";

import './index_node_template_view.css';

ReactDOM.render(
    <React.StrictMode>
        <NodeTemplateMain />
    </React.StrictMode>,
    document.getElementById("node_template_view")
);