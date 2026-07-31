/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
export interface TelegramUser {
	readonly id: number;
	readonly is_bot: boolean;
	readonly first_name: string;
	readonly username?: string;
}

export interface TelegramChat {
	readonly id: number;
	readonly type: string;
	readonly title?: string;
	readonly username?: string;
	readonly first_name?: string;
}

export interface TelegramMessage {
	readonly message_id: number;
	readonly chat: TelegramChat;
	readonly from?: TelegramUser;
	readonly text?: string;
}

export interface TelegramUpdate {
	readonly update_id: number;
	readonly message?: TelegramMessage;
}

interface TelegramEnvelope<T> {
	readonly ok: boolean;
	readonly result?: T;
	readonly description?: string;
	readonly error_code?: number;
}

export class TelegramApiError extends Error {
	constructor(
		message: string,
		readonly status?: number,
		readonly telegramErrorCode?: number
	) {
		super(message);
		this.name = 'TelegramApiError';
	}
}

type TelegramFetcher = (url: string, init: {
	method: string;
	headers: Record<string, string>;
	body: string;
	signal?: AbortSignal;
}) => Promise<Response>;

export class TelegramApi {
	constructor(
		private readonly token: string,
		private readonly baseUrl = 'https://api.telegram.org',
		private readonly fetcher: TelegramFetcher = defaultTelegramFetch
	) { }

	public getMe(signal?: AbortSignal): Promise<TelegramUser> {
		return this.call<TelegramUser>('getMe', {}, signal);
	}

	public getUpdates(offset: number, signal?: AbortSignal): Promise<readonly TelegramUpdate[]> {
		// Keep long-poll moderate: some NATs/firewalls reset idle HTTPS around 20-30s,
		// which surfaces as a generic Electron "fetch failed".
		return this.call<readonly TelegramUpdate[]>('getUpdates', {
			offset,
			timeout: 20,
			allowed_updates: ['message']
		}, signal, 45_000);
	}

	/**
	 * Long polling cannot share a bot token with an active webhook.
	 * Clear any leftover webhook so getUpdates can receive messages.
	 */
	public deleteWebhook(dropPendingUpdates = false, signal?: AbortSignal): Promise<boolean> {
		return this.call<boolean>('deleteWebhook', {
			drop_pending_updates: dropPendingUpdates
		}, signal);
	}

	public getWebhookInfo(signal?: AbortSignal): Promise<{ url?: string; pending_update_count?: number }> {
		return this.call<{ url?: string; pending_update_count?: number }>('getWebhookInfo', {}, signal);
	}

	public sendMessage(
		chatId: string,
		text: string,
		options?: { parseMode?: 'HTML'; signal?: AbortSignal }
	): Promise<TelegramMessage> {
		const body: Record<string, unknown> = {
			chat_id: chatId,
			text,
			disable_web_page_preview: true
		};
		if (options?.parseMode) {
			body.parse_mode = options.parseMode;
		}
		return this.call<TelegramMessage>('sendMessage', body, options?.signal);
	}

	public sendChatAction(chatId: string, action: string = 'typing', signal?: AbortSignal): Promise<boolean> {
		return this.call<boolean>('sendChatAction', {
			chat_id: chatId,
			action
		}, signal);
	}

	public setCommands(signal?: AbortSignal): Promise<boolean> {
		return this.call<boolean>('setMyCommands', {
			commands: [
				{ command: 'start', description: 'Welcome message and pairing guide' },
				{ command: 'pair', description: 'Pair with BatikCode using a pairing code' },
				{ command: 'status', description: 'Show BatikCode and workspace status' },
				{ command: 'code', description: 'Run a coding task in the active workspace' },
				{ command: 'diff', description: 'Show workspace Git status and diff summary' },
				{ command: 'cancel', description: 'Cancel the active coding task' },
				{ command: 'new', description: 'Clear conversation history' },
				{ command: 'models', description: 'List available AI models' },
				{ command: 'model', description: 'Switch AI model (/model <number> or /model auto)' },
				{ command: 'id', description: 'Show your Telegram user ID' },
				{ command: 'help', description: 'Show all available commands' }
			]
		}, signal);
	}

	private async call<T>(method: string, body: object, signal?: AbortSignal, timeoutMs?: number): Promise<T> {
		const merged = mergeAbortSignals(signal, timeoutMs);
		let response: Response;
		try {
			response = await this.fetcher(`${this.baseUrl}/bot${this.token}/${method}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
				signal: merged.signal
			});
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				if (merged.timedOut) {
					throw new TelegramApiError(`Telegram ${method} timed out after ${timeoutMs}ms.`);
				}
				throw error;
			}
			throw new TelegramApiError(formatNetworkError(method, error));
		} finally {
			merged.dispose();
		}

		let envelope: TelegramEnvelope<T>;
		try {
			envelope = await response.json() as TelegramEnvelope<T>;
		} catch {
			throw new TelegramApiError(`Telegram returned HTTP ${response.status} with an invalid response.`, response.status);
		}

		if (!response.ok || !envelope.ok || envelope.result === undefined) {
			throw new TelegramApiError(
				envelope.description || `Telegram returned HTTP ${response.status}.`,
				response.status,
				envelope.error_code
			);
		}
		return envelope.result;
	}
}

/**
 * Prefer Node HTTPS with IPv4-first DNS. Electron/undici fetch often tries IPv6
 * first for api.telegram.org; broken IPv6 paths surface as a bare "fetch failed"
 * even when PowerShell/IPv4 connectivity is healthy.
 */
async function defaultTelegramFetch(url: string, init: {
	method: string;
	headers: Record<string, string>;
	body: string;
	signal?: AbortSignal;
}): Promise<Response> {
	try {
		return await nodeHttpsRequest(url, init);
	} catch (error) {
		if (init.signal?.aborted) {
			throw error;
		}
		try {
			return await fetch(url, init);
		} catch (fallbackError) {
			throw fallbackError instanceof Error ? fallbackError : error;
		}
	}
}

async function nodeHttpsRequest(url: string, init: {
	method: string;
	headers: Record<string, string>;
	body: string;
	signal?: AbortSignal;
}): Promise<Response> {
	const https = await import('node:https');
	const dns = await import('node:dns');
	const { URL } = await import('node:url');
	const target = new URL(url);
	const body = Buffer.from(init.body, 'utf8');

	// Prefer IPv4. Fall back to default lookup only if no A record exists.
	let address = target.hostname;
	let servername: string | undefined;
	try {
		const ipv4 = await dns.promises.lookup(target.hostname, { family: 4 });
		address = ipv4.address;
		servername = target.hostname;
	} catch {
		// Keep hostname; Node will resolve dual-stack as usual.
	}

	return await new Promise<Response>((resolve, reject) => {
		if (init.signal?.aborted) {
			reject(abortError());
			return;
		}

		const request = https.request({
			protocol: target.protocol,
			host: address,
			servername,
			port: target.port || 443,
			path: `${target.pathname}${target.search}`,
			method: init.method,
			headers: {
				...init.headers,
				Host: target.host,
				'Content-Length': String(body.byteLength)
			},
			timeout: 35_000,
			family: 4
		}, response => {
			const chunks: Buffer[] = [];
			response.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
			response.on('end', () => {
				const buffer = Buffer.concat(chunks);
				const headerPairs: Array<[string, string]> = [];
				for (const [key, value] of Object.entries(response.headers)) {
					if (typeof value === 'string') {
						headerPairs.push([key, value]);
					} else if (Array.isArray(value)) {
						for (const item of value) {
							headerPairs.push([key, item]);
						}
					}
				}
				resolve(new Response(buffer, {
					status: response.statusCode ?? 0,
					statusText: response.statusMessage,
					headers: headerPairs
				}));
			});
		});

		const onAbort = () => {
			request.destroy(abortError());
			reject(abortError());
		};
		init.signal?.addEventListener('abort', onAbort, { once: true });
		request.on('error', error => {
			init.signal?.removeEventListener('abort', onAbort);
			reject(error);
		});
		request.on('timeout', () => {
			request.destroy();
			reject(new Error('HTTPS request timed out'));
		});
		request.write(body);
		request.end();
	});
}

function abortError(): Error {
	const error = new Error('The operation was aborted');
	error.name = 'AbortError';
	return error;
}

function formatNetworkError(method: string, error: unknown): string {
	const parts = [`Telegram ${method} network error`];
	for (const entry of walkErrorChain(error)) {
		const detail = [
			entry.name && entry.name !== 'Error' ? entry.name : undefined,
			entry.message,
			entry.code ? `code=${entry.code}` : undefined,
			entry.errno !== undefined ? `errno=${entry.errno}` : undefined,
			entry.syscall ? `syscall=${entry.syscall}` : undefined,
			entry.hostname ? `host=${entry.hostname}` : undefined
		].filter(Boolean).join(' ');
		if (detail) {
			parts.push(detail);
		}
	}
	if (parts.length === 1) {
		parts.push(String(error));
	}
	parts.push('Check outbound HTTPS to api.telegram.org, proxy/VPN/firewall, and that only one BatikCode window owns this bot token.');
	return parts.join(' | ');
}

function walkErrorChain(error: unknown): Array<{
	name?: string;
	message?: string;
	code?: string | number;
	errno?: string | number;
	syscall?: string;
	hostname?: string;
}> {
	const seen = new Set<unknown>();
	const result: Array<{
		name?: string;
		message?: string;
		code?: string | number;
		errno?: string | number;
		syscall?: string;
		hostname?: string;
	}> = [];
	let current: unknown = error;
	while (current && !seen.has(current)) {
		seen.add(current);
		if (current instanceof Error) {
			const anyError = current as Error & {
				code?: string | number;
				errno?: string | number;
				syscall?: string;
				hostname?: string;
				cause?: unknown;
			};
			result.push({
				name: anyError.name,
				message: anyError.message,
				code: anyError.code,
				errno: anyError.errno,
				syscall: anyError.syscall,
				hostname: anyError.hostname
			});
			current = anyError.cause;
			continue;
		}
		if (typeof current === 'object') {
			const anyObject = current as {
				name?: string;
				message?: string;
				code?: string | number;
				errno?: string | number;
				syscall?: string;
				hostname?: string;
				cause?: unknown;
			};
			result.push({
				name: anyObject.name,
				message: anyObject.message,
				code: anyObject.code,
				errno: anyObject.errno,
				syscall: anyObject.syscall,
				hostname: anyObject.hostname
			});
			current = anyObject.cause;
			continue;
		}
		result.push({ message: String(current) });
		break;
	}
	return result;
}

function mergeAbortSignals(signal: AbortSignal | undefined, timeoutMs?: number): {
	signal?: AbortSignal;
	timedOut: boolean;
	dispose: () => void;
} {
	if (!timeoutMs && !signal) {
		return { signal, timedOut: false, dispose: () => { /* no-op */ } };
	}
	const controller = new AbortController();
	let timedOut = false;
	const onAbort = () => controller.abort();
	if (signal) {
		if (signal.aborted) {
			controller.abort();
		} else {
			signal.addEventListener('abort', onAbort, { once: true });
		}
	}
	const timer = timeoutMs
		? setTimeout(() => {
			timedOut = true;
			controller.abort();
		}, timeoutMs)
		: undefined;
	return {
		signal: controller.signal,
		get timedOut() { return timedOut; },
		dispose: () => {
			clearTimeout(timer);
			if (signal && !signal.aborted) {
				signal.removeEventListener('abort', onAbort);
			}
		}
	};
}
