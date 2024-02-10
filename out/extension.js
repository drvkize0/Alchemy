"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const GraphEditor_1 = require("./panels/GraphEditor");
const testViewDragAndDrop_1 = require("./panels/testViewDragAndDrop");
function activate(context) {
    // const cmdCreateOrShowGraphEditor = commands.registerCommand("alchemy.show_graph_editor", () => {
    //     GraphEditorPanel.createOrShow(context.extensionUri);
    // });
    // context.subscriptions.push(cmdCreateOrShowGraphEditor);
    GraphEditor_1.GraphEditorProvider.register(context);
    GraphEditor_1.NodeTemplateDropProvider.register(context);
    new testViewDragAndDrop_1.TestViewDragAndDrop(context);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map