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
const vscode = require("vscode");
class NodeTemplateDropProvider {
    provideDocumentDropEdits(_document, position, dataTransfer, token) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check the data transfer to see if we have some kind of text data
            const dataTransferItem = dataTransfer.get('text/plain');
            if (!dataTransferItem) {
                return undefined;
            }
            const text = yield dataTransferItem.asString();
            if (token.isCancellationRequested) {
                return undefined;
            }
            // Build a snippet to insert
            const snippet = new vscode.SnippetString();
            // Adding the reversed text
            snippet.appendText([...text].reverse().join(''));
            return new vscode.DocumentDropEdit(snippet);
        });
    }
}
//# sourceMappingURL=NodeTemplateDropProvider.js.map