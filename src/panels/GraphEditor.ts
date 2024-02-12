import * as vscode from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";

export class GraphEditorProvider implements vscode.CustomTextEditorProvider {

    private static readonly viewType = "alchemy.graph_editor";
    private readonly extensionUri: vscode.Uri;
    private disposables: vscode.Disposable[] = [];

    constructor( context: vscode.ExtensionContext ) {
        this.extensionUri = context.extensionUri;
    }

    public static register( context: vscode.ExtensionContext ) {
        context.subscriptions.push( vscode.window.registerCustomEditorProvider( GraphEditorProvider.viewType, new GraphEditorProvider( context ) ) );
        context.subscriptions.push( vscode.commands.registerCommand( "alchemy.create_new_graph", () => { GraphEditorProvider.createNewGraph(); } ) );
    }

    private getWebviewContent( webview: vscode.Webview ) {

        const stylesUri = getUri(webview, this.extensionUri, ["webview-ui", "dist_graph_editor", "assets", "graph_editor.css"]);
        const scriptUri = getUri(webview, this.extensionUri, ["webview-ui", "dist_graph_editor", "assets", "graph_editor.js"]);
        const nonce = getNonce();
    
        return /*html*/ `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'nonce-${nonce}'; font-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                    <link rel="stylesheet" type="text/css" href="${stylesUri}">
                </head>
                <body>
                    <div id="graph_editor"></div>
                    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
                </body>
            </html>
        `;
    }

    public dispose() {
        while( this.disposables.length) {
            const disposable = this.disposables.pop();
            if(disposable) {
                disposable.dispose();
            }
        }
    }

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        token: vscode.CancellationToken
    ): Promise<void> {

        webviewPanel.webview.options = {
            enableScripts: true
        };

        webviewPanel.webview.html = this.getWebviewContent( webviewPanel.webview );

        this.bindWebviewMessageListener( webviewPanel.webview );

        this.disposables.push( vscode.workspace.onDidChangeTextDocument(e => {
            console.debug("onDidChangeTextDocument");
			if (e.document.uri.toString() === document.uri.toString()) {
				this.updateGraph( webviewPanel, document );
			}
		}));

        webviewPanel.onDidDispose(() => this.dispose(), null, this.disposables);

        this.updateGraph( webviewPanel, document );
    }

    public updateGraph( webviewPanel: vscode.WebviewPanel, document: vscode.TextDocument ) {
        const msg = {
            command: "alchemy.update_graph",
            data: document.getText(),
        };
        webviewPanel.webview.postMessage(msg);

        vscode.window.showInformationMessage("updateGraph: " + document.getText());
    }

    private bindWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(
            (message: any) => {
                const command = message.command;
                const data = message.data;
    
                switch (command) {
                    case "alchemy.open_node_template":
                        {
                            if( typeof data === 'string' ) {
                                this.openNodeTemplate(data);
                            } else {
                                vscode.window.showErrorMessage( "Alchemy: Invalid command: " + typeof message + typeof data );
                            }
                        }
                        return;
                }
            },
            undefined,
            this.disposables
        );
    }

    static newFileId = 1;
    public static createNewGraph() {

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("Creating new graph requires opening a workspace");
            return;
        }

        const uri = vscode.Uri.joinPath( workspaceFolders[0].uri, `UntitledGraph-${GraphEditorProvider.newFileId++}`)
        .with({ scheme: 'untitled' });
        vscode.commands.executeCommand('vscode.openWith', uri, GraphEditorProvider.viewType);
    }

    private openNodeTemplate( templateUri: string ) {
        vscode.commands.executeCommand(
            "vscode.openWith",
            templateUri,
            "default"
        );
    }
}