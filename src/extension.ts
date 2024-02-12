import { commands, ExtensionContext } from "vscode";
import { GraphEditorProvider } from "./panels/GraphEditor";
import { NodeTemplateView } from "./panels/NodeTemplateView";

export function activate(context: ExtensionContext) {
    
    // const cmdCreateOrShowGraphEditor = commands.registerCommand("alchemy.show_graph_editor", () => {
    //     GraphEditorPanel.createOrShow(context.extensionUri);
    // });

    // context.subscriptions.push(cmdCreateOrShowGraphEditor);

    GraphEditorProvider.register( context );
    NodeTemplateView.register( context );
}
