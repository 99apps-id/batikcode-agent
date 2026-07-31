/*---------------------------------------------------------------------------------------------
 *  Copyright (c) BatikCode contributors. All rights reserved.
 *  Licensed under the MIT License.
 *--------------------------------------------------------------------------------------------*/

import { timingSafeEqual } from 'crypto';

export function parseUserIds(value: string): string[] {
	return [...new Set(value.split(/[\s,]+/).map(item => item.trim()).filter(item => /^\d+$/.test(item)))];
}

export function timingSafeTokenEquals(actual: string, expected: string): boolean {
	const actualBytes = Buffer.from(actual);
	const expectedBytes = Buffer.from(expected);
	return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}
