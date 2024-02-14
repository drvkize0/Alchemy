"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const GraphEditorProvider_1 = require("./panels/GraphEditorProvider");
const NodeTemplateProvider_1 = require("./panels/NodeTemplateProvider");
function activate(context) {
    // const cmdCreateOrShowGraphEditor = commands.registerCommand("alchemy.show_graph_editor", () => {
    //     GraphEditorPanel.createOrShow(context.extensionUri);
    // });
    // context.subscriptions.push(cmdCreateOrShowGraphEditor);
    GraphEditorProvider_1.GraphEditorProvider.register(context);
    NodeTemplateProvider_1.NodeTemplateProvider.register(context);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map