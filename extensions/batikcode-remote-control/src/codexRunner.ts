/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';

const MAX_TOOL_ROUNDS = 15;
const MAX_RETRY_ATTEMPTS = 2;
const MAX_OUTPUT_CHARS = 50_000;

export interface CodexTaskResult {
	readonly output: string;
	readonly exitCode: number;
	readonly truncated: boolean;
}

export interface CodeAgentCallbacks {
	/** Called for each text chunk from the model response. */
	readonly onTextChunk?: (chunk: string) => void;
	/** Called when a tool invocation starts. */
	readonly onToolStart?: (name: string) => void;
	/** Called when a tool invocation finishes. */
	readonly onToolEnd?: (name: string) => void;
}

/**
 * Runs a coding task using the BatikCode language model API with tools,
 * streaming output as the model works.
 */
export class CodexTaskRunner {
	private _busy = false;
	private abortController: AbortController | undefined;

	public get busy(): boolean {
		return this._busy;
	}

	public cancel(): boolean {
		if (this.abortController) {
			this.abortController.abort();
			return true;
		}
		return false;
	}

	public async run(
		workspacePath: string,
		prompt: string,
		timeoutMs: number,
		callbacks: CodeAgentCallbacks,
		token: vscode.CancellationToken
	): Promise<CodexTaskResult> {
		if (this._busy) {
			throw new Error('A Telegram coding task is already running.');
		}
		this._busy = true;
		this.abortController = new AbortController();

		const onTokenCancelled = () => this.abortController?.abort();
		token.onCancellationRequested(onTokenCancelled);

		try {
			return await this.runAgentLoop(workspacePath, prompt, timeoutMs, callbacks, token);
		} finally {
			this.abortController = undefined;
			this._busy = false;
		}
	}

	private async runAgentLoop(
		workspacePath: string,
		task: string,
		timeoutMs: number,
		callbacks: CodeAgentCallbacks,
		token: vscode.CancellationToken
	): Promise<CodexTaskResult> {
		const startTime = Date.now();

		// Pick a model — prefer the BatikCode provider hub.
		const models = await vscode.lm.selectChatModels();
		const model = models.find(m => m.vendor === 'batikcode') ?? models[0];
		if (!model) {
			throw new Error('No AI model available. Add a provider in BatikCode Account & AI Provider Hub.');
		}

		// Collect tools. If vscode.lm.tools is empty or only has chat tools,
		// fall back to text-only mode — the provider (especially CLI transports)
		// may handle tools internally.
		const extensionTools = (vscode.lm.tools ?? [])
			.filter(t => !t.tags?.includes('chat'))
			.map(t => ({
				name: t.name,
				description: t.description,
				inputSchema: t.inputSchema ?? { type: 'object', properties: {} }
			}));
		const hasTools = extensionTools.length > 0;

		const workspace = vscode.workspace.workspaceFolders?.[0];
		const workspaceName = workspace?.name ?? 'workspace';
		const systemPrompt = [
			`You are an AI coding agent running inside BatikCode, invoked via the Telegram /code command.`,
			`Your task is to implement the requested changes in the workspace "${workspaceName}" at ${workspacePath}.`,
			``,
			`Rules:`,
			`- Read files to understand the codebase before making changes.`,
			`- Use available tools to read, write, edit, search, and manage files.`,
			`- After completing the task, provide a concise summary of what you changed.`,
			`- Do NOT expose secrets, publish code, push to remotes, or message third parties.`,
			`- Work inside the current workspace only.`,
		].join('\n');

		const messages: vscode.LanguageModelChatMessage[] = [
			vscode.LanguageModelChatMessage.User(`System: ${systemPrompt}\n\nTask: ${task}`)
		];

		let output = '';
		let truncated = false;
		let toolRounds = 0;

		const appendOutput = (text: string) => {
			if (output.length + text.length > MAX_OUTPUT_CHARS) {
				truncated = true;
				return;
			}
			output += text;
			callbacks.onTextChunk?.(text);
		};

		const isTimedOut = () => Date.now() - startTime >= timeoutMs;

		try {
			while (toolRounds < MAX_TOOL_ROUNDS) {
				if (token.isCancellationRequested) {
					throw new Error(`Task cancelled after ${toolRounds} tool rounds.`);
				}
				if (isTimedOut()) {
					throw new Error(`Task timed out after ${Math.ceil(timeoutMs / 60_000)} minutes.`);
				}
				toolRounds++;

				// Send request with retry for transient network failures.
				const response = await this.sendWithRetry(model, messages, extensionTools, hasTools, token);

				let hasToolCall = false;
				const toolCalls: { callId: string; name: string; input: object }[] = [];

				for await (const part of response.stream) {
					if (token.isCancellationRequested) {
						break;
					}
					if (part instanceof vscode.LanguageModelTextPart) {
						appendOutput(part.value);
					} else if (part instanceof vscode.LanguageModelToolCallPart) {
						hasToolCall = true;
						toolCalls.push({ callId: part.callId, name: part.name, input: part.input });
					}
				}

				if (!hasToolCall) {
					break;
				}

				// Process tool calls.
				const assistantParts: (vscode.LanguageModelTextPart | vscode.LanguageModelToolCallPart)[] = [];
				const userParts: vscode.LanguageModelToolResultPart[] = [];

				for (const tc of toolCalls) {
					callbacks.onToolStart?.(tc.name);
					try {
						const result = await vscode.lm.invokeTool(tc.name, {
							toolInvocationToken: undefined,
							input: tc.input as Record<string, unknown>
						}, token);
						const content = result.content.map(c => {
							if (c instanceof vscode.LanguageModelTextPart) {
								return new vscode.LanguageModelTextPart(c.value);
							}
							if (c instanceof vscode.LanguageModelPromptTsxPart) {
								return new vscode.LanguageModelTextPart(
									typeof c.value === 'string' ? c.value : JSON.stringify(c.value)
								);
							}
							return new vscode.LanguageModelTextPart(
								typeof c === 'string' ? c : JSON.stringify(c)
							);
						});
						assistantParts.push(new vscode.LanguageModelToolCallPart(tc.callId, tc.name, tc.input));
						userParts.push(new vscode.LanguageModelToolResultPart(tc.callId, content));
						callbacks.onToolEnd?.(tc.name);
					} catch (error) {
						const errorText = error instanceof Error ? error.message : String(error);
						assistantParts.push(new vscode.LanguageModelToolCallPart(tc.callId, tc.name, tc.input));
						userParts.push(new vscode.LanguageModelToolResultPart(tc.callId, [
							new vscode.LanguageModelTextPart(`Tool error: ${errorText}`)
						]));
						callbacks.onToolEnd?.(tc.name);
					}
				}

				messages.push(vscode.LanguageModelChatMessage.Assistant(assistantParts));
				messages.push(vscode.LanguageModelChatMessage.User(userParts));
			}

			const finalOutput = output.trim() || '(The agent completed without producing text output.)';
			return {
				output: finalOutput.length > MAX_OUTPUT_CHARS ? finalOutput.slice(0, MAX_OUTPUT_CHARS) + '\n\n[... truncated]' : finalOutput,
				exitCode: 0,
				truncated
			};
		} catch (error) {
			// Include partial output so the user at least sees what was produced.
			const partial = output.trim();
			const partialInfo = partial ? `\n\nPartial output before error:\n${partial.slice(0, 4000)}` : '';
			const prefix = token.isCancellationRequested
				? 'Task cancelled'
				: isTimedOut()
					? `Task timed out after ${Math.ceil(timeoutMs / 60_000)} minutes`
					: 'Agent task failed';
			throw new Error(`${prefix}.${partialInfo}`);
		}
	}

	/**
	 * Sends a chat request with retry on transient network errors ("fetch failed", etc).
	 */
	private async sendWithRetry(
		model: vscode.LanguageModelChat,
		messages: vscode.LanguageModelChatMessage[],
		tools: { name: string; description: string; inputSchema: object }[],
		hasTools: boolean,
		token: vscode.CancellationToken
	): Promise<vscode.LanguageModelChatResponse> {
		let lastError: unknown;
		for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
			try {
				return await model.sendRequest(messages, {
					...(hasTools ? {
						tools,
						toolMode: vscode.LanguageModelChatToolMode.Auto
					} : {}),
					justification: 'BatikCode Telegram /code agent task'
				}, token);
			} catch (error) {
				lastError = error;
				const message = error instanceof Error ? error.message : String(error);
				// Only retry on transient network errors.
				if (!isTransientError(message) || attempt >= MAX_RETRY_ATTEMPTS) {
					throw error;
				}
				// Wait with exponential backoff before retrying.
				const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
				await new Promise<void>(resolve => {
					const timer = setTimeout(resolve, delay);
					token.onCancellationRequested(() => {
						clearTimeout(timer);
						resolve();
					});
				});
			}
		}
		throw lastError;
	}
}

function isTransientError(message: string): boolean {
	return /fetch failed|network error|econnrefused|econnreset|enotfound|etimedout|abort/i.test(message);
}

