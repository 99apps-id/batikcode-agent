/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ProviderProtocol } from './providerCatalog';

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

export function isRetryableStatus(status: number): boolean {
	return status === 401 || status === 403 || status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

/**
 * Resolves the ordered chain of providers that a request can travel through,
 * starting with the requested provider and visiting configured fallbacks
 * depth-first without revisiting a provider (fallback cycles are ignored).
 */
export function resolveFallbackChain(
	configurations: Record<string, ProviderConfiguration>,
	providerId: string
): string[] {
	const result: string[] = [];
	const visit = (id: string) => {
		if (result.includes(id)) {
			return;
		}
		result.push(id);
		for (const fallbackId of configurations[id]?.fallbackProviderIds ?? []) {
			visit(fallbackId);
		}
	};
	visit(providerId);
	return result;
}

export function cooldownDuration(status?: number, headers?: Headers): number {
	if (status === 401 || status === 403) {
		return AUTHENTICATION_COOLDOWN;
	}
	if (status === 429 && headers) {
		return parseRetryAfter(headers) ?? THROTTLE_COOLDOWN;
	}
	return status === 429 ? THROTTLE_COOLDOWN : TRANSIENT_COOLDOWN;
}

export function parseRetryAfter(headers: Headers): number | undefined {
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

export function toOpenAiMessage(message: NormalizedChatMessage, supportsImages: boolean): object {
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

export function extractText(protocol: ProviderProtocol, raw: unknown): string {
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

export function extractToolCalls(protocol: ProviderProtocol, raw: unknown): NormalizedToolCall[] {
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

export function extractModelIds(protocol: ProviderProtocol, raw: unknown, defaultModel?: string): string[] {
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

export function responseError(status: number, raw: unknown, headers?: Headers, providerId?: string): string {
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

export function readPath(value: unknown, ...segments: readonly (string | number)[]): unknown {
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

export function stringValue(value: unknown): string | undefined {
	return typeof value === 'string' && value ? value : undefined;
}

export function stringParts(value: unknown): string {
	if (!Array.isArray(value)) {
		return '';
	}
	return value
		.map(part => stringValue(readPath(part, 'text')))
		.filter((part): part is string => Boolean(part))
		.join('');
}

export function describeRawBody(raw: unknown): string {
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
