// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import ollama from "ollama";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    console.log("DeepSeek is now active!");
    const disposable = vscode.commands.registerCommand("deepseek-ext.startDeepSeek", () => {
        // VS Code panel that will contain the chat dialogue used by the AI
        const panel = vscode.window.createWebviewPanel("deepChat", "Deep Seek Chat", vscode.ViewColumn.One, {
            enableScripts: true,
        });
        //vscode.window.showInformationMessage("Hello World from deepseek-ext!");
        panel.webview.html = getWebviewContent();

        panel.webview.onDidReceiveMessage(async (message: any) => {
            // Ensure only messages from the prompt box are processed
            if (message.command === "deepseek-chat") {
                const userPrompt = message.text;
                let responseText = "";

                // Try and call the local Ollama instance running DeepSeek
                try {
                    const streamResponse = await ollama.chat({
                        model: "deepseek-r1:7b",
                        messages: [{ role: "user", content: userPrompt }],
                        stream: true,
                    });

                    // Add the response sentence by sentence as it is streamed in
                    for await (const part of streamResponse) {
                        responseText += part.message.content;
                        panel.webview.postMessage({ command: "chatResponse", text: responseText });
                    }
                } catch (err) {
                    panel.webview.postMessage({ command: "chatResponse", text: `Error: ${String(err)}` });
                }
            }
        });
    });

    context.subscriptions.push(disposable);
}

// Raw HTML of web panel extension view
function getWebviewContent(): string {
    return /*html*/ `
	<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<style>
					body { font-family: sans-serif; margin: 0 auto; padding: 5rem; }
					#prompt { width: 100%; box-sizing: border-box; padding: 1rem; margin-bottom: 1rem; }
					#response { border: 1px solid #ccc; margin-top: 1rem; padding: 0.5rem; min-height: 5rem; }
                    #submit { display: flex; align-items: center; justify-content: center; max-width: 200px; }
				</style>
			</head>
			<body>
				<h2>DeepSeek VS Code Helper</h2>
				<textarea id="prompt" rows="10" placeholder="Ask something..." value=""></textarea><br />
				<button id="submit">Ask</button>
				<div id="response"></div>

				<script>
					const vscode = acquireVsCodeApi();

                    // handles clicking of the submit button
					document.getElementById('submit').addEventListener('click', () => {
						const text = document.getElementById('prompt').value.trim();
						vscode.postMessage({command: 'deepseek-chat', text});
					});

                    // Adds the response from the AI to the response element on the page and clears the prompt
                    window.addEventListener('message', event => {
                        const {command, text} = event.data;
                        if (command === 'chatResponse') {
                            document.getElementById('prompt').value = "";
                            document.getElementById('response').innerText = text;
                        }
                    })
				</script>
			</body>
		</html>`;
}

// This method is called when your extension is deactivated
export function deactivate() {}
