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
exports.NodeTemplateView = void 0;
const vscode = require("vscode");
const path_1 = require("path");
const getUri_1 = require("../utilities/getUri");
const getNonce_1 = require("../utilities/getNonce");
class NodeTemplateView {
    constructor(context) {
        this.disposables = [];
        this.extensionUri = context.extensionUri;
    }
    static register(context) {
        context.subscriptions.push(vscode.window.registerWebviewViewProvider(NodeTemplateView.viewType, new NodeTemplateView(context)));
        context.subscriptions.push(vscode.commands.registerCommand("alchemy.update_node_templates", () => { NodeTemplateView.updateNodeTemplates(); }));
    }
    resolveWebviewView(webviewView, context, token) {
        NodeTemplateView.webview = webviewView.webview;
        webviewView.webview.options = {
            enableScripts: true
        };
        webviewView.webview.html = this.getWebviewContent(webviewView.webview);
        this.bindWebviewMessageListener(webviewView.webview);
    }
    getWebviewContent(webview) {
        const stylesUri = (0, getUri_1.getUri)(webview, this.extensionUri, ["webview-ui", "dist_node_template_view", "assets", "node_template_view.css"]);
        const scriptUri = (0, getUri_1.getUri)(webview, this.extensionUri, ["webview-ui", "dist_node_template_view", "assets", "node_template_view.js"]);
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
                    <div id="node_template_view"></div>
                    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
                </body>
            </html>
        `;
    }
    bindWebviewMessageListener(webview) {
        return __awaiter(this, void 0, void 0, function* () {
            webview.onDidReceiveMessage((message) => {
                const command = message.command;
                const data = message.data;
                switch (command) {
                    case "alchemy.query_node_templates":
                        NodeTemplateView.updateNodeTemplates();
                        return;
                }
            }, undefined, this.disposables);
        });
    }
    static searchNodeTemplatesRecursive(folderUri, pathUri, templateFiles) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const [name, type] of yield vscode.workspace.fs.readDirectory(folderUri)) {
                if (type === vscode.FileType.File) {
                    if (path_1.posix.extname(name) === ".act") {
                        templateFiles.push(vscode.Uri.joinPath(pathUri, name).path);
                    }
                }
                else if (type === vscode.FileType.Directory) {
                    const childFolderUri = vscode.Uri.joinPath(folderUri, name);
                    const childPathUri = vscode.Uri.joinPath(pathUri, name);
                    yield NodeTemplateView.searchNodeTemplatesRecursive(childFolderUri, childPathUri, templateFiles);
                }
            }
        });
    }
    static updateNodeTemplates() {
        if (typeof NodeTemplateView.webview === 'undefined') {
            return;
        }
        if (typeof vscode.workspace.workspaceFolders === 'undefined') {
            return;
        }
        let templateFiles = [];
        const workspaceFolderUri = vscode.workspace.workspaceFolders[0].uri;
        NodeTemplateView.searchNodeTemplatesRecursive(workspaceFolderUri, vscode.Uri.parse("./"), templateFiles).then(() => {
            // templateFiles.map((fullPath: string) => {
            //     vscode.Uri.parse( fullPath ).with( { path: workspaceFolderUri.path } );
            // });
            vscode.window.showInformationMessage("files: " + templateFiles.toString());
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
exports.NodeTemplateView = NodeTemplateView;
NodeTemplateView.viewType = "alchemy.node_template_view";
//# sourceMappingURL=NodeTemplateView.js.map