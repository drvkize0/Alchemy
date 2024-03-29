"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphEditorProvider = void 0;
const vscode = require("vscode");
const getUri_1 = require("../utilities/getUri");
const getNonce_1 = require("../utilities/getNonce");
const fs_1 = require("fs");
class GraphEditorProvider {
    constructor(context) {
        this.disposables = [];
        this.extensionUri = context.extensionUri;
    }
    static register(context) {
        context.subscriptions.push(vscode.window.registerCustomEditorProvider(GraphEditorProvider.viewType, new GraphEditorProvider(context)));
        context.subscriptions.push(vscode.commands.registerCommand("alchemy.create_new_graph", () => { GraphEditorProvider.createNewGraph(); }));
    }
    getWebviewContent(webview) {
        const stylesUri = (0, getUri_1.getUri)(webview, this.extensionUri, ["webview-ui", "dist_graph_editor", "assets", "graph_editor.css"]);
        const scriptUri = (0, getUri_1.getUri)(webview, this.extensionUri, ["webview-ui", "dist_graph_editor", "assets", "graph_editor.js"]);
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
                    <div id="graph_editor"></div>
                    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
                </body>
            </html>
        `;
    }
    dispose() {
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
    resolveCustomTextEditor(document, webviewPanel, token) {
        return __awaiter(this, void 0, void 0, function* () {
            webviewPanel.webview.options = {
                enableScripts: true
            };
            webviewPanel.webview.html = this.getWebviewContent(webviewPanel.webview);
            this.bindWebviewMessageListener(webviewPanel.webview);
            this.disposables.push(vscode.workspace.onDidChangeTextDocument(e => {
                console.debug("onDidChangeTextDocument");
                if (e.document.uri.toString() === document.uri.toString()) {
                    this.updateGraph(webviewPanel, document);
                }
            }));
            webviewPanel.onDidDispose(() => this.dispose(), null, this.disposables);
            this.updateGraph(webviewPanel, document);
        });
    }
    updateGraph(webviewPanel, document) {
        const msg = {
            command: "alchemy.update_graph",
            data: document.getText(),
        };
        webviewPanel.webview.postMessage(msg);
    }
    bindWebviewMessageListener(webview) {
        webview.onDidReceiveMessage((message) => {
            const command = message.command;
            const data = message.data;
            switch (command) {
                case "alchemy.open_node_template":
                    {
                        if (typeof data === 'string') {
                            this.openNodeTemplate(data);
                        }
                        else {
                            vscode.window.showErrorMessage("Alchemy: Invalid command: " + typeof message + typeof data);
                        }
                    }
                    return;
                case "alchemy.query_node_template":
                    {
                        if (typeof vscode.workspace.workspaceFolders === 'undefined') {
                            return;
                        }
                        const workspaceFolderUri = vscode.Uri.parse(vscode.workspace.workspaceFolders[0].uri.path);
                        const strippedTemplateUri = vscode.Uri.parse(data.templateUri).with({ scheme: undefined, authority: undefined });
                        const templateUri = vscode.Uri.joinPath(workspaceFolderUri, strippedTemplateUri.path);
                        const content = fs_1.promises.readFile(templateUri.fsPath).then((buffer) => {
                            const message = {
                                command: "alchemy.create_node",
                                data: {
                                    template: buffer.toString(),
                                    pos: data.pos
                                }
                            };
                            webview.postMessage(message);
                            vscode.window.showInformationMessage(JSON.stringify(message, null, '\t'));
                        });
                    }
                    break;
            }
        }, undefined, this.disposables);
    }
    static createNewGraph() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("Creating new graph requires opening a workspace");
            return;
        }
        const uri = vscode.Uri.joinPath(workspaceFolders[0].uri, `UntitledGraph-${GraphEditorProvider.newFileId++}`)
            .with({ scheme: 'untitled' });
        vscode.commands.executeCommand('vscode.openWith', uri, GraphEditorProvider.viewType);
    }
    openNodeTemplate(templateUri) {
        vscode.commands.executeCommand("vscode.openWith", templateUri, "default");
    }
}
exports.GraphEditorProvider = GraphEditorProvider;
GraphEditorProvider.viewType = "alchemy.graph_editor";
GraphEditorProvider.newFileId = 1;
//# sourceMappingURL=GraphEditor.js.map