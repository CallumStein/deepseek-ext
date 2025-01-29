"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
const ollama_1 = __importDefault(require("ollama"));
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    console.log("DeepSeek is now active!");
    const disposable = vscode.commands.registerCommand("deepseek-ext.startDeepSeek", () => {
        // VS Code panel that will contain the chat dialogue used by the AI
        const panel = vscode.window.createWebviewPanel("deepChat", "Deep Seek Chat", vscode.ViewColumn.One, {
            enableScripts: true,
        });
        //vscode.window.showInformationMessage("Hello World from deepseek-ext!");
        panel.webview.html = getWebviewContent();
        panel.webview.onDidReceiveMessage(async (message) => {
            // Ensure only messages from the prompt box are processed
            if (message.command === "deepseek-chat") {
                const userPrompt = message.text;
                let responseText = "";
                // Try and call the local Ollama instance running DeepSeek
                try {
                    const streamResponse = await ollama_1.default.chat({
                        model: "deepseek-r1:7b",
                        messages: [{ role: "user", content: userPrompt }],
                        stream: true,
                    });
                    // Add the response sentence by sentence as it is streamed in
                    for await (const part of streamResponse) {
                        responseText += part.message.content;
                        panel.webview.postMessage({ command: "chatResponse", text: responseText });
                    }
                }
                catch (err) {
                    panel.webview.postMessage({ command: "chatResponse", text: `Error: ${String(err)}` });
                }
            }
        });
    });
    context.subscriptions.push(disposable);
}
// Raw HTML of web panel extension view
function getWebviewContent() {
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
function deactivate() { }
//# sourceMappingURL=extension.js.map