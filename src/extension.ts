import { commands, ExtensionContext } from "vscode";
import { GraphEditorProvider, NodeTemplateDropProvider } from "./panels/GraphEditor";
import { TestViewDragAndDrop } from "./panels/testViewDragAndDrop";

export function activate(context: ExtensionContext) {
    
    // const cmdCreateOrShowGraphEditor = commands.registerCommand("alchemy.show_graph_editor", () => {
    //     GraphEditorPanel.createOrShow(context.extensionUri);
    // });

    // context.subscriptions.push(cmdCreateOrShowGraphEditor);

    GraphEditorProvider.register( context );
    NodeTemplateDropProvider.register( context );
    new TestViewDragAndDrop(context);
}
