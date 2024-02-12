"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const GraphEditor_1 = require("./panels/GraphEditor");
const NodeTemplateView_1 = require("./panels/NodeTemplateView");
function activate(context) {
    // const cmdCreateOrShowGraphEditor = commands.registerCommand("alchemy.show_graph_editor", () => {
    //     GraphEditorPanel.createOrShow(context.extensionUri);
    // });
    // context.subscriptions.push(cmdCreateOrShowGraphEditor);
    GraphEditor_1.GraphEditorProvider.register(context);
    NodeTemplateView_1.NodeTemplateView.register(context);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map