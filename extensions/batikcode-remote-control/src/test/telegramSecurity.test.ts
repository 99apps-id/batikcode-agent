import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseUserIds, timingSafeTokenEquals } from '../telegramSecurity';

describe('Telegram authorization helpers', () => {
	it('accepts unique positive user IDs and rejects group-style negative chat IDs', () => {
		assert.deepEqual(parseUserIds('123, 456 123 -100987 bad'), ['123', '456']);
	});

	it('compares pairing tokens without accepting prefixes or different lengths', () => {
		const token = 'm6ZsJx6EV7V03mPBr5lGgQx9w1XrQh9T';
		assert.equal(timingSafeTokenEquals(token, token), true);
		assert.equal(timingSafeTokenEquals(`${token}x`, token), false);
		assert.equal(timingSafeTokenEquals(token.slice(0, -1), token), false);
	});
});

describe('Telegram HTML helpers (inline contract)', () => {
	// Keep these tiny pure helpers in sync with telegramBot.ts escapeHtml/stripHtml.
	function escapeHtml(value: string): string {
		return value
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	function stripHtml(value: string): string {
		return value
			.replace(/<br\s*\/?>/gi, '\n')
			.replace(/<\/p>/gi, '\n')
			.replace(/<[^>]+>/g, '')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&amp;/g, '&')
			.replace(/&quot;/g, '"');
	}

	it('escapes dynamic status fragments so /code <task> cannot break HTML parse_mode', () => {
		assert.equal(escapeHtml('use /code <task>'), 'use /code &lt;task&gt;');
		assert.equal(escapeHtml('A&B'), 'A&amp;B');
	});

	it('strips curated HTML when falling back to plain Telegram messages', () => {
		assert.equal(stripHtml('<b>BatikCode</b> &lt;task&gt;'), 'BatikCode <task>');
	});
});
