import * as vscode from "vscode";

class NodeTemplateDropProvider implements vscode.DocumentDropEditProvider {
    async provideDocumentDropEdits(
		_document: vscode.TextDocument,
		position: vscode.Position,
		dataTransfer: vscode.DataTransfer,
		token: vscode.CancellationToken
	): Promise<vscode.DocumentDropEdit | undefined> {
		// Check the data transfer to see if we have some kind of text data
		const dataTransferItem = dataTransfer.get('text/plain');
		if (!dataTransferItem) {
			return undefined;
		}

		const text = await dataTransferItem.asString();
		if (token.isCancellationRequested) {
			return undefined;
		}

		// Build a snippet to insert
		const snippet = new vscode.SnippetString();
		// Adding the reversed text
		snippet.appendText([...text].reverse().join(''));

		return new vscode.DocumentDropEdit(snippet);
	}
}