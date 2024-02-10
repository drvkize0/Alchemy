"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphEditorPanel = void 0;
const vscode_1 = require("vscode");
const getUri_1 = require("../utilities/getUri");
const getNonce_1 = require("../utilities/getNonce");
class GraphEditorPanel {
    dispose() {
        GraphEditorPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
    _getWebviewContent(webview, extensionUri) {
        const stylesUri = (0, getUri_1.getUri)(webview, extensionUri, ["webview-ui", "build", "assets", "index.css"]);
        const scriptUri = (0, getUri_1.getUri)(webview, extensionUri, ["webview-ui", "build", "assets", "index.js"]);
        const nonce = (0, getNonce_1.getNonce)();
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
                    <div id="root"></div>
                    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
                </body>
            </html>
        `;
    }
    _openNodeTemplate(templateUri) {
        vscode_1.commands.executeCommand("vscode.openWith", templateUri, "default");
        // if( typeof workspace.workspaceFolders === 'undefined' ) {
        //     window.showErrorMessage( "Require a workspace to be opened" );
        //     return;
        // }
        // if( !fs.existsSync( templateUri ) ) {
        //     window.showErrorMessage( "Can't open " + templateUri + ", file doesn't exist." );
        //     return;
        // }
        // workspace.openTextDocument( templateUri ).then((textDocument: TextDocument) => {
        //     const viewColumn = window.activeTextEditor ? window.activeTextEditor.viewColumn : undefined;
        //     window.showTextDocument( textDocument, viewColumn || ViewColumn.One );
        // });
    }
    createNewNodeTemplate() {
        const jsonNodePrefab = {
            name: "Default Node Name",
            description: 'Description',
            parameters: [
                { name: 'a', type: "int", value: 0 },
                { name: 'b', type: "int", value: 0 }
            ],
            returnValues: [
                { name: 'sum', type: "int", value: 0 }
            ]
        };
        vscode_1.workspace.openTextDocument({
            language: "json",
            content: JSON.stringify(jsonNodePrefab, null, '\t')
        }).then((textDocument) => {
            const viewColumn = vscode_1.window.activeTextEditor ? vscode_1.window.activeTextEditor.viewColumn : undefined;
            vscode_1.window.showTextDocument(textDocument, viewColumn || vscode_1.ViewColumn.One);
        });
    }
    _createNewNode(templateUri) {
        vscode_1.workspace.openTextDocument(templateUri).then((document) => {
            const text = document.getText();
            this._panel.webview.postMessage({
                command: "alchemy.create_new_node",
                data: text
            });
        });
    }
    _setWebviewMessageListener(webview) {
        webview.onDidReceiveMessage((message) => {
            const command = message.command;
            const data = message.data;
            switch (command) {
                case "hello":
                    vscode_1.window.showInformationMessage(data);
                    return;
                case "alchemy.open_node_template":
                    {
                        if (typeof data === 'string') {
                            this._openNodeTemplate(data);
                        }
                        vscode_1.window.showErrorMessage("Alchemy: Invalid command: " + message);
                    }
                    return;
            }
        }, undefined, this._disposables);
    }
    constructor(panel, extentionUri) {
        this._disposables = [];
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, extentionUri);
        this._setWebviewMessageListener(this._panel.webview);
    }
    static createOrShow(extensionUri) {
        const viewColumn = vscode_1.window.activeTextEditor ? vscode_1.window.activeTextEditor.viewColumn : undefined;
        if (GraphEditorPanel.currentPanel) {
            GraphEditorPanel.currentPanel._panel.reveal(viewColumn);
        }
        else {
            const panel = vscode_1.window.createWebviewPanel("alchemy.graph_editor", "untitled", viewColumn || vscode_1.ViewColumn.One, {
                enableScripts: true,
                localResourceRoots: [
                    vscode_1.Uri.joinPath(extensionUri, "out"),
                    vscode_1.Uri.joinPath(extensionUri, "webview-ui/build")
                ]
            });
            GraphEditorPanel.currentPanel = new GraphEditorPanel(panel, extensionUri);
        }
    }
}
exports.GraphEditorPanel = GraphEditorPanel;
//# sourceMappingURL=GraphEditorPanel.js.map