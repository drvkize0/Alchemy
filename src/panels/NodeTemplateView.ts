import * as vscode from "vscode";
import { posix } from 'path';
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { nodes as initialNodes, edges as initialEdges } from "./test_nodes_edges";

export class NodeTemplateView implements vscode.WebviewViewProvider {
    private static readonly viewType = "alchemy.node_template_view";
    private readonly extensionUri: vscode.Uri;
    private static webview: vscode.Webview;
    private disposables: vscode.Disposable[] = [];

    constructor( context: vscode.ExtensionContext ) {
        this.extensionUri = context.extensionUri;
    }

    public static register( context: vscode.ExtensionContext ) {
        context.subscriptions.push( vscode.window.registerWebviewViewProvider( NodeTemplateView.viewType, new NodeTemplateView( context ) ) );
        context.subscriptions.push( vscode.commands.registerCommand( "alchemy.update_node_templates", () => { NodeTemplateView.updateNodeTemplates(); } ) );
    }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext<unknown>,
        token: vscode.CancellationToken): void | Thenable<void>
    {
        NodeTemplateView.webview = webviewView.webview;

        webviewView.webview.options = {
            enableScripts: true
        };

        webviewView.webview.html = this.getWebviewContent(webviewView.webview);
        this.bindWebviewMessageListener(webviewView.webview);
    }

    private getWebviewContent( webview: vscode.Webview ) {
        const stylesUri = getUri(webview, this.extensionUri, ["webview-ui", "dist_node_template_view", "assets", "node_template_view.css"]);
        const scriptUri = getUri(webview, this.extensionUri, ["webview-ui", "dist_node_template_view", "assets", "node_template_view.js"]);
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
                    <div id="node_template_view"></div>
                    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
                </body>
            </html>
        `;
    }

    private async bindWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(
            (message: any) => {
                const command = message.command;
                const data = message.data;
    
                switch (command) {
                    case "alchemy.query_node_templates":
                        NodeTemplateView.updateNodeTemplates();
                        return;
                }
            },
            undefined,
            this.disposables
        );
    }

    private static async searchNodeTemplatesRecursive( folderUri: vscode.Uri, pathUri: vscode.Uri, templateFiles: string[] ) {
        for(const [name, type] of await vscode.workspace.fs.readDirectory( folderUri )) {
            if( type === vscode.FileType.File ) {
                if( posix.extname( name ) === ".act" ) {
                    templateFiles.push( vscode.Uri.joinPath( pathUri, name ).path );
                }
            }
            else if( type === vscode.FileType.Directory ) {
                const childFolderUri = vscode.Uri.joinPath( folderUri, name );
                const childPathUri = vscode.Uri.joinPath( pathUri, name );
                await NodeTemplateView.searchNodeTemplatesRecursive( childFolderUri, childPathUri, templateFiles );
            }
        }
    }

    public static updateNodeTemplates() {

        if( typeof NodeTemplateView.webview === 'undefined' ) {
            return;
        }

        if( typeof vscode.workspace.workspaceFolders === 'undefined' ) {
            return;
        }

        let templateFiles: string[] = [];
        const workspaceFolderUri = vscode.workspace.workspaceFolders[0].uri;
        NodeTemplateView.searchNodeTemplatesRecursive( workspaceFolderUri, vscode.Uri.parse("./"), templateFiles ).then( () => {
            // templateFiles.map((fullPath: string) => {
            //     vscode.Uri.parse( fullPath ).with( { path: workspaceFolderUri.path } );
            // });

            vscode.window.showInformationMessage( "files: " + templateFiles.toString() );

            const message = {
                command: "alchemy.update_node_templates",
                data: JSON.stringify({
                    nodeTemplates: templateFiles
                })
            };

            NodeTemplateView.webview.postMessage(message);
        });
    }
}