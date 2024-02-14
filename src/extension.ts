import { commands, ExtensionContext } from "vscode";
import { GraphEditorProvider } from "./panels/GraphEditorProvider";
import { NodeTemplateProvider } from "./panels/NodeTemplateProvider";

export function activate(context: ExtensionContext) {
    
    // const cmdCreateOrShowGraphEditor = commands.registerCommand("alchemy.show_graph_editor", () => {
    //     GraphEditorPanel.createOrShow(context.extensionUri);
    // });

    // context.subscriptions.push(cmdCreateOrShowGraphEditor);

    GraphEditorProvider.register( context );
    NodeTemplateProvider.register( context );
}
