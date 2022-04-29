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

function getWebviewHTML(webview: vscode.Webview, extensionPath: string, baseUri: vscode.Uri) {

	const appJsOnDisk = vscode.Uri.file(path.join(extensionPath, 'statics', 'app.umd.js'));
	const appJsSrc = webview.asWebviewUri(appJsOnDisk);

	const baseSrc = webview.asWebviewUri(baseUri);

	const nonce = getNonce();

	return `<!DOCTYPE html>
			<html lang="zh">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' ${webview.cspSource} https:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-eval';">
				<script defer nonce="${nonce}" src="${appJsSrc}"></script>
				<title>Markdown Preview</title>
				<base href="${baseSrc}" />
			</head>
			<body>
				<div id="app"></div>
				<script nonce="${nonce}" type="module">
					run("#app")
				</script>
			</body>
			</html>`;
}

const updateContent = (textDocument: vscode.TextDocument, previewPanel: vscode.WebviewPanel) => {
	if (textDocument.isClosed) {
		previewPanel.dispose();
		return;
	}
	const [frontMatter, content] = getFrontMatterAndContent(textDocument.getText());
	previewPanel.webview.postMessage({ frontMatter, content });
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "clog" is now active!');
	
	let textDocument: vscode.TextDocument | undefined = undefined;
	let webviewPanel: vscode.WebviewPanel | undefined = undefined;
	const commandShowPreview = "clog.showPreview";

	const commandShowPreviewHandler = () => {
		textDocument = vscode.window.activeTextEditor?.document;
		if (textDocument === undefined) {
			console.log('no activated text document');
			return;
		}

		if (webviewPanel) {
			webviewPanel.reveal(webviewPanel.viewColumn);
		} else {
			let localResourceRoots = [vscode.Uri.file(context.extensionPath)];
			const workspaceFolders = vscode.workspace.workspaceFolders;
			for (let workspaceFolder of workspaceFolders || []) {
				localResourceRoots.push(workspaceFolder.uri);
			}

			webviewPanel = vscode.window.createWebviewPanel(
				'mdPreview',
				'Markdown Preview',
				vscode.ViewColumn.Two,
				{
					enableScripts: true,
					localResourceRoots,
				}
			);

			const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument( event => {
				if (textDocument && webviewPanel && textDocument === event.document) {
					updateContent(textDocument, webviewPanel);
				}
			});

			const onDidCloseTextDocument = vscode.workspace.onDidCloseTextDocument( document => {
				if (textDocument && webviewPanel && textDocument === document) {
					webviewPanel.dispose();
				}
			});

			const onDidChangeTextEditor = vscode.window.onDidChangeActiveTextEditor( textEditor => {
				const document = textEditor?.document;
				if(document && document.uri.scheme === 'file' && document.uri.path.endsWith('.md') && webviewPanel) {
					textDocument = document;
					webviewPanel.webview.html = getWebviewHTML(webviewPanel.webview, context.extensionPath, textDocument.uri);
					updateContent(textDocument, webviewPanel);
				}
			});

			webviewPanel.onDidDispose(
				() => {
					onDidChangeTextDocument.dispose();
					onDidCloseTextDocument.dispose();
					onDidChangeTextEditor.dispose();
					webviewPanel = undefined;
				},
				null,
				context.subscriptions
			);
		}

		webviewPanel.webview.html = getWebviewHTML(webviewPanel.webview, context.extensionPath, textDocument.uri);
		updateContent(textDocument, webviewPanel);
	};

	context.subscriptions.push(vscode.commands.registerCommand(commandShowPreview, commandShowPreviewHandler));
}

// this method is called when your extension is deactivated
export function deactivate() { }
