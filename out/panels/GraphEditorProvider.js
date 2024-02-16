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
    resolveCustomTextEditor(document, webviewPanel, token) {
        return __awaiter(this, void 0, void 0, function* () {
            vscode.languages.setTextDocumentLanguage(document, "acg");
            webviewPanel.webview.options = {
                enableScripts: true
            };
            webviewPanel.webview.html = this.getWebviewContent(webviewPanel.webview);
            let clientState = {
                clientVersion: undefined
            };
            console.debug("Alchemy: resolveCustomTextEditor new client state");
            this.bindWebviewMessageListener(webviewPanel.webview, document, clientState);
            const onDidChangeTextDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
                if (e.document.uri.toString() === document.uri.toString()) {
                    this.updateGraph(webviewPanel.webview, document, clientState);
                }
            });
            webviewPanel.onDidDispose(() => {
                onDidChangeTextDocumentSubscription.dispose();
            });
            //this.updateGraph( webviewPanel.webview, document, clientState );
        });
    }
    static createNewGraph() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("Creating new graph requires opening a workspace");
            return;
        }
        const uri = vscode.Uri.joinPath(workspaceFolders[0].uri, `UntitledGraph-${GraphEditorProvider.newFileId++}.acg`)
            .with({ scheme: 'untitled' });
        vscode.commands.executeCommand('vscode.openWith', uri, GraphEditorProvider.viewType);
    }
    static openNodeTemplate(uri) {
        const templateUri = vscode.Uri.from({ scheme: "file", path: uri });
        const viewColumn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : vscode.ViewColumn.One;
        vscode.commands.executeCommand("vscode.openWith", templateUri, "default", viewColumn);
    }
    readNodeTemplate(templateUri) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (typeof vscode.workspace.workspaceFolders === 'undefined') {
                    return reject();
                }
                const workspaceFolderUri = vscode.Uri.parse(vscode.workspace.workspaceFolders[0].uri.path);
                const strippedTemplateUri = vscode.Uri.parse(templateUri).with({ scheme: undefined, authority: undefined });
                const finalTemplateUri = vscode.Uri.joinPath(workspaceFolderUri, strippedTemplateUri.path);
                fs_1.promises.readFile(finalTemplateUri.fsPath).then((buffer) => {
                    const template = JSON.parse(buffer.toString());
                    template.templateUri = finalTemplateUri.fsPath;
                    const retTemplate = JSON.stringify(template);
                    return resolve(retTemplate);
                }).catch(() => {
                    console.error("Alchemy: failed to open " + finalTemplateUri.fsPath);
                });
            });
        });
    }
    createNode(webview, templateUri, pos) {
        this.readNodeTemplate(templateUri).then((template) => {
            if (typeof template === "string") {
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
            console.error("Alchemy: failed read template: " + templateUri);
        });
    }
    updateGraph(webview, document, clientState) {
        if (typeof clientState.clientVersion !== "undefined" && document.version <= clientState.clientVersion) {
            console.debug("Alchemy: updateGraph failed with clientVersion: " + clientState.clientVersion + " document version: " + document.version);
            return;
        }
        const msg = {
            command: "alchemy.update_graph",
            data: document.getText(),
            version: document.version
        };
        webview.postMessage(msg);
        console.debug("Alchemy: updateGraph with clientVersion: " + clientState.clientVersion + " document version: " + document.version);
    }
    onUpdateDocument(document, content, version, clientState) {
        return __awaiter(this, void 0, void 0, function* () {
            const edit = new vscode.WorkspaceEdit();
            clientState.clientVersion = version;
            if (version <= document.version) {
                console.debug("Alchemy: update document failed with version: " + version + "\n" + content);
                return;
            }
            edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), content, undefined);
            console.debug("Alchemy: updateDocument with version: " + version + "\n" + content);
            return yield vscode.workspace.applyEdit(edit);
        });
    }
    onQueryDocument(webview, document, version, clientState) {
        clientState.clientVersion = version;
        this.updateGraph(webview, document, clientState);
    }
    bindWebviewMessageListener(webview, document, clientState) {
        webview.onDidReceiveMessage((message) => {
            const command = message.command;
            const data = message.data;
            const version = message.version;
            switch (command) {
                case "alchemy.open_node_template":
                    console.debug("Alchemy: data.templateUri = " + data);
                    GraphEditorProvider.openNodeTemplate(data);
                    return;
                case "alchemy.query_node_template":
                    this.createNode(webview, data.templateUri, data.pos);
                    break;
                case "alchemy.update_document":
                    this.onUpdateDocument(document, data, version, clientState);
                    break;
                case "alchemy.query_document":
                    console.debug("Alchemy: onQueryDocument with client version: version: " + version + " document version: " + document.version);
                    this.onQueryDocument(webview, document, version, clientState);
                    break;
            }
        });
    }
}
exports.GraphEditorProvider = GraphEditorProvider;
GraphEditorProvider.viewType = "alchemy.graph_editor";
GraphEditorProvider.newFileId = 1;
//# sourceMappingURL=GraphEditorProvider.js.map