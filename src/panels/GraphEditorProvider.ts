import * as vscode from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { promises as fsPromises } from "fs";
import { clearLine } from "readline";

type GraphEditorClientState = {
    clientVersion: number | undefined
};

export class GraphEditorProvider implements vscode.CustomTextEditorProvider {

    private static readonly viewType = "alchemy.graph_editor";
    private readonly extensionUri: vscode.Uri;

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

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        token: vscode.CancellationToken
    ): Promise<void> {

        vscode.languages.setTextDocumentLanguage( document, "acg" );

        webviewPanel.webview.options = {
            enableScripts: true
        };

        webviewPanel.webview.html = this.getWebviewContent( webviewPanel.webview );

        let clientState: GraphEditorClientState = {
            clientVersion: undefined
        };

        console.debug( "Alchemy: resolveCustomTextEditor new client state" );

        this.bindWebviewMessageListener( webviewPanel.webview, document, clientState );

        const onDidChangeTextDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
			if( e.document.uri.toString() === document.uri.toString() ) {
                this.updateGraph( webviewPanel.webview, document, clientState );
			}
		});

        webviewPanel.onDidDispose(() => {
            onDidChangeTextDocumentSubscription.dispose();
        });

        //this.updateGraph( webviewPanel.webview, document, clientState );
    }

    static newFileId = 1;
    public static createNewGraph() {

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("Creating new graph requires opening a workspace");
            return;
        }

        const uri = vscode.Uri.joinPath( workspaceFolders[0].uri, `UntitledGraph-${GraphEditorProvider.newFileId++}.acg` )
            .with({ scheme: 'untitled' });

        vscode.commands.executeCommand( 'vscode.openWith', uri, GraphEditorProvider.viewType );
    }

    public static openNodeTemplate( uri: string ) {
        const templateUri = vscode.Uri.from( { scheme: "file", path: uri } );
        const viewColumn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : vscode.ViewColumn.One;

        vscode.commands.executeCommand(
            "vscode.openWith",
            templateUri,
            "default",
            viewColumn
        );
    }

    private async readNodeTemplate( templateUri: string ): Promise<string> {
        return new Promise((resolve, reject) => {
            if( typeof vscode.workspace.workspaceFolders === 'undefined' ) {
                return reject();
            }
            
            const workspaceFolderUri = vscode.Uri.parse( vscode.workspace.workspaceFolders[0].uri.path );
            const strippedTemplateUri = vscode.Uri.parse( templateUri ).with( { scheme: undefined, authority: undefined } );
            const finalTemplateUri = vscode.Uri.joinPath( workspaceFolderUri, strippedTemplateUri.path );

            fsPromises.readFile( finalTemplateUri.fsPath ).then((buffer: Buffer) => {
                const template = JSON.parse( buffer.toString() );
                template.templateUri = finalTemplateUri.fsPath;
                const retTemplate = JSON.stringify( template );
                return resolve( retTemplate );

            }).catch(() => {
                console.error( "Alchemy: failed to open " + finalTemplateUri.fsPath );
            });
        });
    }

    private createNode( webview: vscode.Webview, templateUri: string, pos: any ) {

        this.readNodeTemplate( templateUri ).then((template: string) => {

            if( typeof template === "string" ) {

                const message = {
                    command: "alchemy.create_node",
                    data: {
                        template: template,
                        pos: pos
                    }
                };
            
                webview.postMessage(message);
            }
        }).catch(() => {
            console.error( "Alchemy: failed read template: " + templateUri );
        });
    }

    private updateGraph( webview: vscode.Webview, document: vscode.TextDocument, clientState: GraphEditorClientState ) {
        if( typeof clientState.clientVersion !== "undefined" && document.version <= clientState.clientVersion ) {
            console.debug( "Alchemy: updateGraph failed with clientVersion: " + clientState.clientVersion + " document version: " + document.version );
            return;
        }

        const msg = {
            command: "alchemy.update_graph",
            data: document.getText(),
            version: document.version
        };
        webview.postMessage(msg);

        console.debug( "Alchemy: updateGraph with clientVersion: " + clientState.clientVersion + " document version: " + document.version );
    }

    private async onUpdateDocument( document: vscode.TextDocument, content: string, version: number, clientState: GraphEditorClientState ) {
        const edit = new vscode.WorkspaceEdit();

        clientState.clientVersion = version;

        if( version <= document.version ) {
            console.debug( "Alchemy: update document failed with version: " + version + "\n" + content );
            return;
        }

        edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            content,
            undefined
        );

        console.debug( "Alchemy: updateDocument with version: " + version + "\n" + content );
        return await vscode.workspace.applyEdit( edit );
    }

    private onQueryDocument( webview: vscode.Webview, document: vscode.TextDocument, version: number | undefined, clientState: GraphEditorClientState ) {
        clientState.clientVersion = version;
        this.updateGraph( webview, document, clientState );
    }

    private bindWebviewMessageListener(webview: vscode.Webview, document: vscode.TextDocument, clientState: GraphEditorClientState ) {
        webview.onDidReceiveMessage(
            (message: any) => {
                const command = message.command;
                const data = message.data;
                const version = message.version;
    
                switch (command) {
                    case "alchemy.open_node_template":
                        console.debug( "Alchemy: data.templateUri = " + data );
                        GraphEditorProvider.openNodeTemplate( data );
                        return;
                    case "alchemy.query_node_template":
                        this.createNode( webview, data.templateUri, data.pos );
                        break;
                    case "alchemy.update_document":
                        this.onUpdateDocument( document, data, version, clientState );
                        break;
                    case "alchemy.query_document":
                        console.debug( "Alchemy: onQueryDocument with client version: version: " + version + " document version: " + document.version );
                        this.onQueryDocument( webview, document, version, clientState );
                        break;
                }
            }
        );
    }
}