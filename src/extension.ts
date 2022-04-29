// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

function getFrontMatterAndContent(text: string) {
	if (text.startsWith('+++')) {
		let lineEnd = "";
		if (text[3] === '\r' && text[4] === '\n') {
			lineEnd = "\r\n";
		} else if (text[3] === '\n') {
			lineEnd = "\n";
		} else {
			return ["", text];
		}

		const pos = text.indexOf(`${lineEnd}+++${lineEnd}`, 3);
		return [text.substring(3 + lineEnd.length, pos + lineEnd.length),
		text.substring(pos + 3 + lineEnd.length * 2)];
	} else {
		return ["", text];
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

function getWebviewHTML(webview: vscode.Webview, extensionPath: string) {

	const appJsOnDisk = vscode.Uri.file(path.join(extensionPath, 'statics', 'app.umd.js'));
	const appJsSrc = webview.asWebviewUri(appJsOnDisk);

	const nonce = getNonce();

	return `<!DOCTYPE html>
			<html lang="zh">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-eval';">
				<script defer nonce="${nonce}" src="${appJsSrc}"></script>
				<title>Markdown Preview</title>
			</head>
			<body>
				<div id="app"></div>
				<script nonce="${nonce}" type="module">
					run("#app")
				</script>
			</body>
			</html>`;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "clog" is now active!');

	let previewPanel: vscode.WebviewPanel | undefined = undefined;
	let previewTextEditor: vscode.TextEditor | undefined = undefined;
	const commandShowPreview = "clog.showPreview";

	const commandShowPreviewHandler = () => {

		const columnToShowIn = (previewPanel && previewPanel.viewColumn) || vscode.ViewColumn.Two;
		const textDocument = (previewTextEditor && previewTextEditor.document) || vscode.window.activeTextEditor?.document;

		if (textDocument === undefined) {
			console.log("no activated text document");
			return;
		}

		if (previewPanel) {
			previewPanel.reveal(columnToShowIn);
		} else {
			previewPanel = vscode.window.createWebviewPanel(
				'mdPreview',
				'Markdown Preview',
				columnToShowIn,
				{
					enableScripts: true,
					localResourceRoots: [vscode.Uri.file(context.extensionPath)]
				}
			);

			previewPanel.webview.html = getWebviewHTML(previewPanel.webview, context.extensionPath);

			const updateContent = (textDocument: vscode.TextDocument, previewPanel: vscode.WebviewPanel) => {
				if (textDocument.isClosed) {
					previewPanel.dispose();
					return;
				}
				const [frontMatter, content] = getFrontMatterAndContent(textDocument.getText());
				previewPanel.webview.postMessage({ frontMatter, content });
			};
			updateContent(textDocument, previewPanel);
			const interval = setInterval(updateContent, 100, textDocument, previewPanel);

			previewPanel.onDidDispose(
				() => {
					clearInterval(interval);
					previewPanel = undefined;
				},
				null,
				context.subscriptions
			);
		}

	};

	context.subscriptions.push(vscode.commands.registerCommand(commandShowPreview, commandShowPreviewHandler));
}

// this method is called when your extension is deactivated
export function deactivate() { }
