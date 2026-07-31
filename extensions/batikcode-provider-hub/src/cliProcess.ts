/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';

export interface CliInvocation {
	readonly target: string;
	readonly args: readonly string[];
}

export function createCliInvocation(
	executable: string,
	args: readonly string[],
	platform = process.platform,
	commandProcessor = process.env.ComSpec || 'cmd.exe'
): CliInvocation {
	if (platform === 'win32' && /\.(?:bat|cmd)$/i.test(executable)) {
		// `cmd /c call <script> <args>` lets Node quote every argv entry itself.
		// Wrapping the complete command in another pair of quotes makes cmd.exe
		// interpret the entire command line as one executable name.
		return {
			target: commandProcessor,
			args: ['/d', '/c', 'call', executable, ...args]
		};
	}
	return { target: executable, args };
}

export function normalizeWorkingDirectoryCandidate(candidate: string): string {
	const normalized = path.normalize(candidate);
	const marker = normalized.toLowerCase().indexOf('.build\\electron');
	if (marker < 0) {
		return normalized;
	}
	// Source builds start Electron from `<repo>/.build/electron`. Codex should
	// work in the repository, never in the application binary directory. This
	// also repairs the historical malformed `<repo>.build/electron` path.
	return normalized.slice(0, marker).replace(/[\\/]+$/, '');
}
