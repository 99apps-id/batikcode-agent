/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { PROVIDERS, ProviderAuthentication, ProviderDefinition, ProviderProtocol } from './providerCatalog';
import { ProviderAccountCandidate, ProviderAccountPool } from './providerAccountPool';
import { ProviderModelCatalog } from './providerModelCatalog';
import { openAiChatCompletionsUrl, supportsImageInput } from './providerProtocol';

const CONFIGURATION_STATE_KEY = 'batikcode.providerRouter.configurations';
const AUTHENTICATION_COOLDOWN = 5 * 60_000;
const THROTTLE_COOLDOWN = 60_000;
const TRANSIENT_COOLDOWN = 15_000;

export interface ProviderConfiguration {
	readonly endpoint?: string;
	readonly model?: string;
	readonly fallbackProviderIds?: readonly string[];
	readonly customHeaderName?: string;
	readonly customHeaderPrefix?: string;
}

export interface ProviderRouterStatus {
	readonly configured: boolean;
	readonly accountCount: number;
	readonly enabledAccountCount: number;
	readonly keyCount: number;
	readonly endpoint?: string;
	readonly model?: string;
	readonly models: readonly string[];
	readonly fallbackProviderIds: readonly string[];
}

export interface NormalizedChatMessage {
	readonly role: 'system' | 'user' | 'assistant' | 'tool';
	readonly content: string | readonly NormalizedContentPart[];
	readonly toolCallId?: string;
	readonly toolCalls?: readonly NormalizedToolCall[];
}

export interface NormalizedContentPart {
	readonly type: 'text' | 'image';
	readonly text?: string;
	readonly data?: string;
	readonly mimeType?: string;
}

export interface NormalizedToolCall {
	readonly id: string;
	readonly name: string;
	readonly arguments: object;
}

export interface NormalizedTool {
	readonly name: string;
	readonly description: string;
	readonly inputSchema: object;
}

export interface ProviderChatRequest {
	readonly providerId: string;
	readonly messages: readonly NormalizedChatMessage[];
	readonly model?: string;
	readonly maxTokens?: number;
	readonly temperature?: number;
	readonly timeoutMs?: number;
	readonly signal?: AbortSignal;
	readonly tools?: readonly NormalizedTool[];
	readonly toolMode?: 'auto' | 'required';
	readonly onText?: (text: string) => void;
}

export interface ProviderAttempt {
	readonly providerId: string;
	readonly accountId?: string;
	readonly accountName?: string;
	readonly keyIndex?: number;
	readonly status?: number;
	readonly reason: string;
}

export interface ProviderChatResponse {
	readonly providerId: string;
	readonly model?: string;
	readonly text: string;
	readonly raw: unknown;
	readonly attempts: readonly ProviderAttempt[];
	readonly toolCalls: readonly NormalizedToolCall[];
}

interface PreparedRequest {
	readonly url: string;
	readonly headers: Record<string, string>;
	readonly body: unknown;
}

export class ProviderRouter {
	private readonly changeEmitter = new vscode.EventEmitter<void>();
	public readonly onDidChange = this.changeEmitter.event;

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly accountPool: ProviderAccountPool,
		private readonly modelCatalog: ProviderModelCatalog
	) {
		context.subscriptions.push(
			this.changeEmitter,
			this.accountPool.onDidChange(() => this.changeEmitter.fire()),
			this.modelCatalog.onDidChange(() => this.changeEmitter.fire())
		);
	}

	public async getStatus(providerId: string): Promise<ProviderRouterStatus> {
		const provider = this.requireRoutableProvider(providerId);
		const configuration = this.getConfiguration(providerId);
		const hasSavedConfiguration = Object.prototype.hasOwnProperty.call(this.getConfigurations(), providerId);
		const accounts = await this.accountPool.getSummaries(providerId);
		const endpoint = configuration.endpoint?.trim() || provider.routing?.defaultEndpoint;
		const models = this.modelCatalog.getModels(provider.id, [configuration.model ?? '', provider.routing?.defaultModel ?? '']);
		const model = models[0];
		const enabledAccountCount = accounts.filter(account => account.enabled).length;
		const configured = Boolean(
			endpoint
			&& model
			&& (provider.routing?.requiresKey ? enabledAccountCount > 0 : hasSavedConfiguration || provider.kind === 'local')
		);
		return {
			configured,
			accountCount: accounts.length,
			enabledAccountCount,
			keyCount: accounts.length,
			endpoint,
			model,
			models,
			fallbackProviderIds: configuration.fallbackProviderIds ?? []
		};
	}

	public async configure(providerId: string): Promise<void> {
		const provider = this.requireRoutableProvider(providerId);
		const current = this.getConfiguration(providerId);
		const items: vscode.QuickPickItem[] = [];
		if (provider.routing?.requiresKey) {
			items.push({ label: '$(accounts-view-bar-icon) Manage API accounts', description: 'Named credentials, enablement, priority, rotation, and health' });
		}
		items.push(
			{ label: '$(server-environment) Configure endpoint', description: 'Set the API-compatible base URL' },
			{ label: '$(symbol-array) Configure models', description: 'Add multiple model IDs shown in the Chat Models picker' },
			...(provider.id === 'azure' ? [] : [{ label: '$(cloud-download) Discover models', description: 'Load model IDs from the configured provider endpoint' }]),
			{ label: '$(debug-disconnect) Configure fallback order', description: 'Choose providers used after retryable failures' },
			{ label: '$(trash) Remove provider configuration', description: 'Delete stored keys and non-secret preferences' }
		);

		const selected = await vscode.window.showQuickPick(items, {
			title: `Configure ${provider.name}`,
			placeHolder: 'Choose what to configure'
		});
		if (!selected) {
			return;
		}

		if (selected.label.includes('API accounts')) {
			await this.accountPool.manage(provider.id, provider.name);
		} else if (selected.label.includes('endpoint')) {
			await this.configureEndpoint(provider, current);
		} else if (selected.label.includes('Configure models')) {
			await this.modelCatalog.configure(provider.id, provider.name, [current.model ?? '', provider.routing?.defaultModel ?? '']);
		} else if (selected.label.includes('Discover')) {
			await this.discoverModels(provider);
		} else if (selected.label.includes('fallback')) {
			await this.configureFallback(provider, current);
		} else if (selected.label.includes('Remove')) {
			await this.removeConfiguration(provider);
		}
	}

	public async routeChat(request: ProviderChatRequest): Promise<ProviderChatResponse> {
		if (!request.messages.length) {
			throw new Error('A provider request must include at least one message.');
		}

		const providerIds = this.resolveFallbackChain(request.providerId);
		const attempts: ProviderAttempt[] = [];
		let lastError: Error | undefined;
		// Track whether any streaming tokens have been emitted for this request.
		// Once text reaches the caller via onText, retrying with another account
		// would append a fresh full response to the already-visible partial text,
		// resulting in garbled output. We raise immediately instead.
		let streamingStarted = false;

		for (const providerId of providerIds) {
			const provider = this.requireRoutableProvider(providerId);
			const configuration = this.getConfiguration(providerId);
			const status = await this.getStatus(providerId);
			const accounts = provider.routing?.requiresKey
				? await this.accountPool.getCandidates(providerId)
				: [anonymousCandidate(providerId)];
			if (provider.routing?.requiresKey && accounts.length === 0) {
				attempts.push({ providerId, reason: 'No enabled API account configured' });
				continue;
			}

			const requestedModel = providerId === request.providerId ? request.model : undefined;
			const resolvedModel = requestedModel && status.models.includes(requestedModel) ? requestedModel : status.models[0];
			if (!resolvedModel) {
				attempts.push({ providerId, reason: 'No model configured' });
				continue;
			}

			for (const account of accounts) {
				if (account.coolingDown) {
					attempts.push(attemptFor(providerId, account, 'Account is cooling down'));
					continue;
				}

				try {
					const prepared = this.prepareRequest(provider, configuration, account.secret, { ...request, model: resolvedModel });
					const response = await fetchWithTimeout(prepared.url, {
						method: 'POST',
						headers: prepared.headers,
						body: JSON.stringify(prepared.body)
					}, request.timeoutMs ?? 120_000, request.signal);
					if (response.ok && provider.routing?.protocol === 'openai' && request.onText) {
						// Wrap onText so we know the moment streaming begins; any
						// subsequent error must not fall through to the next account.
						const guardedOnText = (chunk: string) => {
							streamingStarted = true;
							request.onText!(chunk);
						};
						const streamed = await parseOpenAiStream(response, guardedOnText);
						// Guard: a 200 response with no extractable text and no tool calls
						// means the body was not valid JSON — treat as a retryable failure.
						if (!streamed.text && !streamed.toolCalls.length) {
							const bodyPreview = describeRawBody(streamed.raw);
							const reason = `Provider returned an empty or non-JSON response body${bodyPreview ? ': ' + bodyPreview : ''}.`;
							attempts.push({ ...attemptFor(providerId, account, reason), status: response.status });
							if (provider.routing?.requiresKey) {
								this.accountPool.markFailure(providerId, account.id, reason, cooldownDuration());
							}
							lastError = new Error(reason);
							continue;
						}
						if (provider.routing.requiresKey) {
							this.accountPool.markSuccess(providerId, account.id);
						}
						return {
							providerId,
							model: resolvedModel,
							text: streamed.text,
							raw: streamed.raw,
							attempts,
							toolCalls: streamed.toolCalls
						};
					}
					const raw = await parseResponse(response);
					if (response.ok) {
						const text = extractText(provider.routing!.protocol, raw);
						const calls = extractToolCalls(provider.routing!.protocol, raw);
						// Guard: a 200 response with no extractable text and no tool calls
						// means the body was not valid JSON — treat as a retryable failure.
						if (!text && !calls.length) {
							const bodyPreview = describeRawBody(raw);
							const reason = `Provider returned an empty or non-JSON response body${bodyPreview ? ': ' + bodyPreview : ''}.`;
							attempts.push({ ...attemptFor(providerId, account, reason), status: response.status });
							if (provider.routing?.requiresKey) {
								this.accountPool.markFailure(providerId, account.id, reason, cooldownDuration());
							}
							lastError = new Error(reason);
							continue;
						}
						if (provider.routing?.requiresKey) {
							this.accountPool.markSuccess(providerId, account.id);
						}
						return {
							providerId,
							model: resolvedModel,
							text,
							raw,
							attempts,
							toolCalls: calls
						};
					}

					const reason = responseError(response.status, raw, response.headers, provider.id);
					attempts.push({ ...attemptFor(providerId, account, reason), status: response.status });
					if (!isRetryableStatus(response.status)) {
						throw new ProviderRequestError(reason, attempts, false);
					}
					if (provider.routing?.requiresKey) {
						this.accountPool.markFailure(providerId, account.id, reason, cooldownDuration(response.status, response.headers));
					}
					lastError = new Error(reason);
				} catch (error) {
					if (error instanceof ProviderRequestError) {
						throw error;
					}
					if (request.signal?.aborted) {
						throw new ProviderRequestError('Provider request was cancelled.', attempts, false);
					}
					const reason = safeErrorMessage(error);
					attempts.push(attemptFor(providerId, account, reason));
					// Streaming already started: partial text is in the user's view.
					// Retrying would append a duplicate full response — surface the
					// error immediately instead.
					if (streamingStarted) {
						throw new ProviderRequestError(reason, attempts, false);
					}
					if (provider.routing?.requiresKey && !isTimeoutError(error)) {
						this.accountPool.markFailure(providerId, account.id, reason, cooldownDuration());
					}
					lastError = new Error(reason);
				}
			}
		}

		throw new ProviderRequestError(lastError?.message ?? 'No configured provider could handle the request.', attempts, true);
	}

	private async configureEndpoint(provider: ProviderDefinition, current: ProviderConfiguration): Promise<void> {
		const endpoint = await vscode.window.showInputBox({
			title: `${provider.name} endpoint`,
			value: current.endpoint || provider.routing?.defaultEndpoint || '',
			prompt: provider.id === 'azure'
				? 'Azure resource endpoint. Each configured model ID is treated as an Azure deployment name; api-version is added automatically.'
				: 'Base URL used for provider requests.',
			ignoreFocusOut: true,
			validateInput: validateEndpoint
		});
		if (endpoint === undefined) {
			return;
		}
		let customHeaderName = current.customHeaderName;
		let customHeaderPrefix = current.customHeaderPrefix;
		if (provider.routing?.authentication === 'custom') {
			customHeaderName = await vscode.window.showInputBox({
				title: `${provider.name} authentication header`,
				value: current.customHeaderName || 'Authorization',
				prompt: 'Header name used to send the API key.',
				ignoreFocusOut: true
			});
			if (customHeaderName === undefined) {
				return;
			}
			customHeaderPrefix = await vscode.window.showInputBox({
				title: `${provider.name} authentication prefix`,
				value: current.customHeaderPrefix ?? 'Bearer ',
				prompt: 'Optional value prefix, for example “Bearer ”.',
				ignoreFocusOut: true
			});
			if (customHeaderPrefix === undefined) {
				return;
			}
		}

		await this.updateConfiguration(provider.id, {
			...current,
			endpoint: endpoint.replace(/\/+$/, ''),
			customHeaderName: customHeaderName?.trim(),
			customHeaderPrefix
		});
		void vscode.window.showInformationMessage(`${provider.name} endpoint updated.`);
	}

	private async discoverModels(provider: ProviderDefinition): Promise<void> {
		const configuration = this.getConfiguration(provider.id);
		const endpoint = (configuration.endpoint || provider.routing?.defaultEndpoint || '').replace(/\/+$/, '');
		if (!endpoint) {
			throw new Error(`${provider.name} endpoint is not configured.`);
		}
		const account = provider.routing?.requiresKey
			? (await this.accountPool.getCandidates(provider.id)).find(candidate => !candidate.coolingDown)
			: anonymousCandidate(provider.id);
		if (!account) {
			throw new Error(`${provider.name} does not have an enabled API account available.`);
		}
		const headers: Record<string, string> = { Accept: 'application/json' };
		applyAuthentication(headers, provider.routing!.authentication, account.secret, configuration);
		if (provider.routing?.protocol === 'anthropic') {
			headers['anthropic-version'] = '2023-06-01';
		}
		const url = provider.routing?.protocol === 'ollama' ? `${endpoint}/tags` : `${endpoint}/models`;
		const response = await fetchWithTimeout(url, { method: 'GET', headers }, 15_000);
		const raw = await parseResponse(response);
		const defaultModel = provider.routing?.defaultModel;
		if (!response.ok) {
			// Not every OpenAI-compatible API implements model listing (Perplexity
			// and Azure OpenAI do not). A missing catalogue is not a broken
			// connection, so fall back to the known default rather than leaving the
			// provider unusable. Authentication failures still surface.
			const catalogueMissing = response.status === 404 || response.status === 405 || response.status === 501;
			if (!catalogueMissing || !defaultModel) {
				throw new Error(responseError(response.status, raw, undefined, provider.id));
			}
			await this.modelCatalog.mergeModels(provider.id, [defaultModel], [configuration.model ?? '', defaultModel]);
			void vscode.window.showInformationMessage(
				`${provider.name} does not publish a model list. Using "${defaultModel}" — add more models from Chat Models.`
			);
			return;
		}
		const discovered = extractModelIds(provider.routing!.protocol, raw, defaultModel);
		if (!discovered.length) {
			throw new Error(`${provider.name} returned no recognizable model IDs.`);
		}
		const models = await this.modelCatalog.mergeModels(
			provider.id,
			discovered,
			[configuration.model ?? '', provider.routing?.defaultModel ?? '']
		);
		void vscode.window.showInformationMessage(`${provider.name}: ${models.length} models are now available in Chat Models.`);
	}

	private async configureFallback(provider: ProviderDefinition, current: ProviderConfiguration): Promise<void> {
		const candidates = PROVIDERS.filter(candidate => candidate.routing && candidate.id !== provider.id);
		const selected = await vscode.window.showQuickPick(
			candidates.map(candidate => ({
				label: candidate.name,
				description: candidate.routing?.protocol,
				picked: current.fallbackProviderIds?.includes(candidate.id),
				providerId: candidate.id
			})),
			{
				title: `${provider.name} fallback providers`,
				placeHolder: 'Selected providers are tried in the displayed order',
				canPickMany: true
			}
		);
		if (!selected) {
			return;
		}
		await this.updateConfiguration(provider.id, {
			...current,
			fallbackProviderIds: selected.map(item => item.providerId)
		});
		void vscode.window.showInformationMessage(`${provider.name}: ${selected.length} fallback provider${selected.length === 1 ? '' : 's'} configured.`);
	}

	private async removeConfiguration(provider: ProviderDefinition): Promise<void> {
		const confirmation = await vscode.window.showWarningMessage(
			`Remove stored ${provider.name} credentials and routing preferences?`,
			{ modal: true },
			'Remove'
		);
		if (confirmation !== 'Remove') {
			return;
		}
		await this.accountPool.clear(provider.id);
		await this.modelCatalog.clear(provider.id);
		const configurations = { ...this.getConfigurations() };
		delete configurations[provider.id];
		await this.context.globalState.update(CONFIGURATION_STATE_KEY, configurations);
		void vscode.window.showInformationMessage(`${provider.name} configuration removed.`);
	}

	private prepareRequest(
		provider: ProviderDefinition,
		configuration: ProviderConfiguration,
		key: string,
		request: ProviderChatRequest
	): PreparedRequest {
		const routing = provider.routing!;
		const endpoint = (configuration.endpoint || routing.defaultEndpoint || '').replace(/\/+$/, '');
		if (!endpoint) {
			throw new Error(`${provider.name} endpoint is not configured.`);
		}
		const model = request.model || configuration.model || routing.defaultModel;
		if (!model) {
			throw new Error(`${provider.name} model is not configured.`);
		}
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			Accept: 'application/json'
		};
		applyAuthentication(headers, routing.authentication, key, configuration);

		switch (routing.protocol) {
			case 'anthropic': {
				headers['anthropic-version'] = '2023-06-01';
				const system = request.messages.filter(message => message.role === 'system').map(message => message.content).join('\n\n');
				return {
					url: `${endpoint}/messages`,
					headers,
					body: {
						model,
						max_tokens: request.maxTokens ?? 1024,
						...(system ? { system } : {}),
						messages: request.messages.filter(message => message.role !== 'system').map(message => ({ role: message.role, content: message.content })),
						...(request.temperature === undefined ? {} : { temperature: request.temperature }),
						...(request.tools?.length ? {
							tools: request.tools.map(tool => ({
								name: tool.name,
								description: tool.description,
								input_schema: tool.inputSchema
							})),
							tool_choice: request.toolMode === 'required' ? { type: 'any' as const } : { type: 'auto' as const }
						} : {})
					}
				};
			}
			case 'gemini':
				return {
					url: `${endpoint}/models/${encodeURIComponent(model)}:generateContent`,
					headers,
					body: {
						contents: request.messages.filter(message => message.role !== 'system').map(message => ({
							role: message.role === 'assistant' ? 'model' : 'user',
							parts: [{ text: message.content }]
						})),
						...(request.messages.some(message => message.role === 'system') ? {
							systemInstruction: {
								parts: request.messages.filter(message => message.role === 'system').map(message => ({ text: message.content }))
							}
						} : {}),
						generationConfig: {
							...(request.maxTokens === undefined ? {} : { maxOutputTokens: request.maxTokens }),
							...(request.temperature === undefined ? {} : { temperature: request.temperature })
						},
						...(request.tools?.length ? {
							tools: [{
								functionDeclarations: request.tools.map(tool => ({
									name: tool.name,
									description: tool.description,
									parameters: tool.inputSchema
								}))
							}],
							toolConfig: {
								functionCallingConfig: {
									mode: request.toolMode === 'required' ? 'ANY' as const : 'AUTO' as const
								}
							}
						} : {})
					}
				};
			case 'ollama':
				return {
					url: `${endpoint}/chat`,
					headers,
					body: {
						model,
						messages: request.messages,
						stream: false,
						options: {
							...(request.maxTokens === undefined ? {} : { num_predict: request.maxTokens }),
							...(request.temperature === undefined ? {} : { temperature: request.temperature })
						}
					}
				};
			case 'openai':
				return {
					url: openAiChatCompletionsUrl(provider.id, endpoint, model),
					headers,
					body: {
						model,
						messages: request.messages.map(message => toOpenAiMessage(message, supportsImageInput(provider.id, model))),
						...(request.maxTokens === undefined ? {} : { max_tokens: request.maxTokens }),
						...(request.temperature === undefined ? {} : { temperature: request.temperature }),
						...(request.tools?.length ? {
							tools: request.tools.map(tool => ({
								type: 'function',
								function: {
									name: tool.name,
									description: tool.description,
									parameters: tool.inputSchema
								}
							})),
							tool_choice: request.toolMode ?? 'auto'
						} : {}),
						...(request.onText ? { stream: true } : {}),
						...(provider.id === 'nvidia' && /nemotron-3-(?:super|ultra)/i.test(model) ? {
							chat_template_kwargs: {
								enable_thinking: true,
								force_nonempty_content: true
							}
						} : {})
					}
				};
		}
	}

	private resolveFallbackChain(providerId: string): string[] {
		const result: string[] = [];
		const visit = (id: string) => {
			if (result.includes(id)) {
				return;
			}
			result.push(id);
			for (const fallbackId of this.getConfiguration(id).fallbackProviderIds ?? []) {
				visit(fallbackId);
			}
		};
		visit(providerId);
		return result;
	}

	private getConfiguration(providerId: string): ProviderConfiguration {
		return this.getConfigurations()[providerId] ?? {};
	}

	private getConfigurations(): Record<string, ProviderConfiguration> {
		return this.context.globalState.get<Record<string, ProviderConfiguration>>(CONFIGURATION_STATE_KEY, {});
	}

	private async updateConfiguration(providerId: string, configuration: ProviderConfiguration): Promise<void> {
		await this.context.globalState.update(CONFIGURATION_STATE_KEY, {
			...this.getConfigurations(),
			[providerId]: configuration
		});
		this.changeEmitter.fire();
	}

	private requireRoutableProvider(providerId: string): ProviderDefinition {
		const provider = PROVIDERS.find(candidate => candidate.id === providerId && candidate.routing)
			?? PROVIDERS.find(candidate => candidate.vendor === providerId && candidate.routing);
		if (!provider) {
			throw new Error(`Provider “${providerId}” does not have a BatikCode routing adapter.`);
		}
		return provider;
	}
}

export class ProviderRequestError extends Error {
	constructor(
		message: string,
		public readonly attempts: readonly ProviderAttempt[],
		public readonly exhausted: boolean
	) {
		super(message);
		this.name = 'ProviderRequestError';
	}
}

export function isRetryableStatus(status: number): boolean {
	return status === 401 || status === 403 || status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

function applyAuthentication(
	headers: Record<string, string>,
	authentication: ProviderAuthentication,
	key: string,
	configuration: ProviderConfiguration
): void {
	switch (authentication) {
		case 'bearer':
			headers.Authorization = `Bearer ${key}`;
			break;
		case 'x-api-key':
			headers['x-api-key'] = key;
			break;
		case 'x-goog-api-key':
			headers['x-goog-api-key'] = key;
			break;
		case 'api-key':
			headers['api-key'] = key;
			break;
		case 'custom':
			headers[configuration.customHeaderName || 'Authorization'] = `${configuration.customHeaderPrefix ?? 'Bearer '}${key}`;
			break;
		case 'none':
			break;
	}
}

function anonymousCandidate(providerId: string): ProviderAccountCandidate {
	return { id: `${providerId}-anonymous`, name: 'No authentication', secret: '', index: 0, coolingDown: false };
}

function attemptFor(providerId: string, account: ProviderAccountCandidate, reason: string): ProviderAttempt {
	return {
		providerId,
		accountId: account.secret ? account.id : undefined,
		accountName: account.secret ? account.name : undefined,
		keyIndex: account.secret ? account.index : undefined,
		reason
	};
}

function cooldownDuration(status?: number, headers?: Headers): number {
	if (status === 401 || status === 403) {
		return AUTHENTICATION_COOLDOWN;
	}
	if (status === 429 && headers) {
		return parseRetryAfter(headers) ?? THROTTLE_COOLDOWN;
	}
	return status === 429 ? THROTTLE_COOLDOWN : TRANSIENT_COOLDOWN;
}

function parseRetryAfter(headers: Headers): number | undefined {
	const value = headers.get('retry-after');
	if (!value) {
		return undefined;
	}
	// Retry-Agent: <seconds> (e.g. "15")
	const seconds = parseInt(value, 10);
	if (!isNaN(seconds) && seconds > 0) {
		return Math.min(seconds * 1000, THROTTLE_COOLDOWN);
	}
	// Retry-After: <http-date> (e.g. "Wed, 21 Oct 2015 07:28:00 GMT")
	const date = Date.parse(value);
	if (!isNaN(date)) {
		const delta = date - Date.now();
		return delta > 0 ? Math.min(delta, THROTTLE_COOLDOWN) : undefined;
	}
	return undefined;
}

function toOpenAiMessage(message: NormalizedChatMessage, supportsImages: boolean): object {
	if (message.role === 'tool') {
		return {
			role: 'tool',
			tool_call_id: message.toolCallId,
			content: contentText(message.content)
		};
	}
	return {
		role: message.role,
		content: Array.isArray(message.content)
			? message.content.map(part => part.type === 'image'
				? supportsImages
					? {
						type: 'image_url',
						image_url: { url: `data:${part.mimeType ?? 'application/octet-stream'};base64,${part.data ?? ''}` }
					}
					// The target model is not vision-capable. Downgrade the image to a
					// text placeholder instead of sending an image_url part the API
					// cannot deserialize (DeepSeek's endpoint rejects it with
					// "unknown variant `image_url`, expected `text`").
					: { type: 'text', text: `[Image attached: ${part.mimeType ?? 'image'}, ${part.data?.length ?? 0} base64 bytes]` }
				: { type: 'text', text: part.text ?? '' })
			: message.content,
		...(message.toolCalls?.length ? {
			tool_calls: message.toolCalls.map(call => ({
				id: call.id,
				type: 'function',
				function: { name: call.name, arguments: JSON.stringify(call.arguments) }
			}))
		} : {})
	};
}

function contentText(content: NormalizedChatMessage['content']): string {
	return typeof content === 'string'
		? content
		: content.filter(part => part.type === 'text').map(part => part.text ?? '').join('\n');
}

function validateEndpoint(value: string): string | undefined {
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:' ? undefined : 'Use an HTTP or HTTPS endpoint.';
	} catch {
		return 'Enter a valid endpoint URL.';
	}
}

async function parseResponse(response: Response): Promise<unknown> {
	const text = await response.text();
	if (!text) {
		return undefined;
	}
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

interface StreamedOpenAiResponse {
	readonly text: string;
	readonly toolCalls: readonly NormalizedToolCall[];
	readonly raw: unknown;
}

async function parseOpenAiStream(response: Response, onText: (text: string) => void): Promise<StreamedOpenAiResponse> {
	if (!response.headers.get('content-type')?.includes('text/event-stream')) {
		const raw = await parseResponse(response);
		const responseText = extractText('openai', raw);
		if (responseText) {
			onText(responseText);
		}
		return { text: responseText, toolCalls: extractToolCalls('openai', raw), raw };
	}
	if (!response.body) {
		throw new Error('Provider returned an empty streaming response.');
	}
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let text = '';
	let lastRaw: unknown;
	const pendingTools = new Map<number, { id: string; name: string; arguments: string }>();
	const inspect = (line: string) => {
		if (!line.startsWith('data:')) {
			return;
		}
		const payload = line.slice(5).trim();
		if (!payload || payload === '[DONE]') {
			return;
		}
		let raw: unknown;
		try {
			raw = JSON.parse(payload);
		} catch {
			throw new Error('Provider returned an invalid streaming JSON event.');
		}
		lastRaw = raw;
		const content = stringValue(readPath(raw, 'choices', 0, 'delta', 'content'));
		if (content) {
			text += content;
			onText(content);
		}
		const toolDeltas = readPath(raw, 'choices', 0, 'delta', 'tool_calls');
		if (!Array.isArray(toolDeltas)) {
			return;
		}
		for (const delta of toolDeltas) {
			const indexValue = readPath(delta, 'index');
			const index = typeof indexValue === 'number' ? indexValue : 0;
			const current = pendingTools.get(index) ?? { id: '', name: '', arguments: '' };
			current.id += stringValue(readPath(delta, 'id')) ?? '';
			current.name += stringValue(readPath(delta, 'function', 'name')) ?? '';
			current.arguments += stringValue(readPath(delta, 'function', 'arguments')) ?? '';
			pendingTools.set(index, current);
		}
	};
	while (true) {
		const { done, value } = await reader.read();
		buffer += decoder.decode(value, { stream: !done });
		const lines = buffer.split(/\r?\n/);
		buffer = lines.pop() ?? '';
		for (const line of lines) {
			inspect(line);
		}
		if (done) {
			if (buffer.trim()) {
				inspect(buffer.trim());
			}
			break;
		}
	}
	const toolCalls = [...pendingTools.values()].flatMap(call => {
		if (!call.id || !call.name) {
			return [];
		}
		let args: object = {};
		try {
			const parsed: unknown = JSON.parse(call.arguments || '{}');
			if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
				args = parsed as object;
			}
		} catch {
			args = { value: call.arguments };
		}
		return [{ id: call.id, name: call.name, arguments: args }];
	});
	return { text, toolCalls, raw: lastRaw };
}

async function fetchWithTimeout(
	url: string,
	init: RequestInit,
	timeoutMs: number,
	externalSignal?: AbortSignal
): Promise<Response> {
	const controller = new AbortController();
	const abort = () => controller.abort();
	externalSignal?.addEventListener('abort', abort, { once: true });
	const timeout = setTimeout(abort, timeoutMs);
	try {
		return await fetch(url, { ...init, signal: controller.signal });
	} finally {
		clearTimeout(timeout);
		externalSignal?.removeEventListener('abort', abort);
	}
}

function extractText(protocol: ProviderProtocol, raw: unknown): string {
	switch (protocol) {
		case 'anthropic':
			return stringParts(readPath(raw, 'content'));
		case 'gemini':
			return stringParts(readPath(raw, 'candidates', 0, 'content', 'parts'));
		case 'ollama':
			return stringValue(readPath(raw, 'message', 'content')) ?? stringValue(readPath(raw, 'response')) ?? '';
		case 'openai':
			return stringValue(readPath(raw, 'choices', 0, 'message', 'content'))
				?? stringValue(readPath(raw, 'choices', 0, 'text'))
				?? stringValue(readPath(raw, 'output_text'))
				?? '';
	}
	return '';
}

function extractToolCalls(protocol: ProviderProtocol, raw: unknown): NormalizedToolCall[] {
	switch (protocol) {
		case 'openai': {
			const values = readPath(raw, 'choices', 0, 'message', 'tool_calls');
			if (!Array.isArray(values)) {
				return [];
			}
			return values.flatMap(value => {
				const id = stringValue(readPath(value, 'id'));
				const name = stringValue(readPath(value, 'function', 'name'));
				const serialized = stringValue(readPath(value, 'function', 'arguments'));
				if (!id || !name) {
					return [];
				}
				const args = parseArguments(serialized);
				return [{ id, name, arguments: args }];
			});
		}
		case 'anthropic': {
			const content = readPath(raw, 'content');
			if (!Array.isArray(content)) {
				return [];
			}
			return content.flatMap(block => {
				if (!block || typeof block !== 'object' || (block as Record<string, unknown>).type !== 'tool_use') {
					return [];
				}
				const b = block as Record<string, unknown>;
				const id = stringValue(b.id);
				const name = stringValue(b.name);
				if (!id || !name) {
					return [];
				}
				const input = b.input;
				const args: object = input && typeof input === 'object' && !Array.isArray(input)
					? input as object
					: {};
				return [{ id, name, arguments: args }];
			});
		}
		case 'gemini': {
			const parts = readPath(raw, 'candidates', 0, 'content', 'parts');
			if (!Array.isArray(parts)) {
				return [];
			}
			return parts.flatMap(part => {
				if (!part || typeof part !== 'object') {
					return [];
				}
				const p = part as Record<string, unknown>;
				const fc = p.functionCall;
				if (!fc || typeof fc !== 'object') {
					return [];
				}
				const f = fc as Record<string, unknown>;
				const name = stringValue(f.name);
				if (!name) {
					return [];
				}
				const args = f.args && typeof f.args === 'object' && !Array.isArray(f.args)
					? f.args as object
					: {};
				return [{ id: name, name, arguments: args }];
			});
		}
		default:
			return [];
	}
}

function parseArguments(serialized: string | undefined): object {
	if (!serialized) {
		return {};
	}
	try {
		const parsed: unknown = JSON.parse(serialized);
		if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
			return parsed as object;
		}
	} catch {
		// Fall through to fallback.
	}
	return { value: serialized };
}

function extractModelIds(protocol: ProviderProtocol, raw: unknown, defaultModel?: string): string[] {
	const values = protocol === 'gemini'
		? readPath(raw, 'models')
		: protocol === 'ollama'
			? readPath(raw, 'models')
			: readPath(raw, 'data');
	if (!Array.isArray(values)) {
		return [];
	}
	const usesVendorPrefixInDefault = defaultModel?.includes('/') ?? false;
	return [...new Set(values
		.map(value => {
			let modelId = stringValue(readPath(value, protocol === 'ollama' ? 'name' : 'id'))
				?? (protocol === 'gemini' ? stringValue(readPath(value, 'name'))?.replace(/^models\//, '') : undefined);
			// Strip vendor prefix (e.g. "deepseek-ai/DeepSeek-V3.2" → "DeepSeek-V3.2")
			// only when the provider's own default model doesn't use vendor-prefixed names.
			if (modelId && !usesVendorPrefixInDefault) {
				const slashIndex = modelId.indexOf('/');
				if (slashIndex > 0 && slashIndex < modelId.length - 1) {
					modelId = modelId.slice(slashIndex + 1);
				}
			}
			return modelId;
		})
		.filter((model): model is string => Boolean(model)))];
}

function responseError(status: number, raw: unknown, headers?: Headers, providerId?: string): string {
	const detail = stringValue(raw)
		?? stringValue(readPath(raw, 'error', 'message'))
		?? stringValue(readPath(raw, 'message'))
		?? stringValue(readPath(raw, 'error', 'status'));
	const base = detail
		? `Provider returned HTTP ${status}: ${String(detail).slice(0, 300)}`
		: `Provider returned HTTP ${status}.`;
	if (status === 429) {
		const retryAfter = headers ? parseRetryAfter(headers) : undefined;
		const waitInfo = retryAfter ? ` Retry after ${(retryAfter / 1000) | 0}s.` : '';
		return `Rate limit exceeded (HTTP 429).${waitInfo} ${base}`;
	}
	if (providerId) {
		if (status === 401) {
			return `Authentication failed for ${providerId}. Please check your API key and try again.`;
		}
		if (status === 404) {
			return `Endpoint not found for ${providerId}. Please check your endpoint configuration.`;
		}
		if (status === 500) {
			return `Internal server error for ${providerId}. Please try again later.`;
		}
	}
	return base;
}

function readPath(value: unknown, ...segments: readonly (string | number)[]): unknown {
	let current = value;
	for (const segment of segments) {
		if (typeof segment === 'number') {
			if (!Array.isArray(current)) {
				return undefined;
			}
			current = current[segment];
		} else {
			if (!current || typeof current !== 'object') {
				return undefined;
			}
			current = (current as Record<string, unknown>)[segment];
		}
	}
	return current;
}

function stringValue(value: unknown): string | undefined {
	return typeof value === 'string' && value ? value : undefined;
}

function stringParts(value: unknown): string {
	if (!Array.isArray(value)) {
		return '';
	}
	return value
		.map(part => stringValue(readPath(part, 'text')))
		.filter((part): part is string => Boolean(part))
		.join('');
}

function safeErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.name === 'AbortError' ? 'Provider request was cancelled or timed out.' : error.message;
	}
	return String(error);
}

function describeRawBody(raw: unknown): string {
	if (raw === undefined || raw === null) {
		return 'empty body';
	}
	if (typeof raw === 'string') {
		const trimmed = raw.trim();
		if (!trimmed) {
			return 'empty body';
		}
		const preview = trimmed.slice(0, 200);
		return trimmed.length > 200 ? `non-JSON text: "${preview}..."` : `non-JSON text: "${preview}"`;
	}
	return '';
}

function isTimeoutError(error: unknown): boolean {
	return error instanceof Error && error.name === 'AbortError';
}
