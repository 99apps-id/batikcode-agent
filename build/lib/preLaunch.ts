/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import path from 'path';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const rootDir = path.resolve(import.meta.dirname, '..', '..');

function runProcess(command: string, args: ReadonlyArray<string> = []) {
	return new Promise<void>((resolve, reject) => {
		const child = spawn(command, args, { cwd: rootDir, stdio: 'inherit', env: process.env, shell: process.platform === 'win32' });
		child.on('exit', err => !err ? resolve() : process.exit(err ?? 1));
		child.on('error', reject);
	});
}

async function exists(subdir: string) {
	try {
		await fs.stat(path.join(rootDir, subdir));
		return true;
	} catch {
		return false;
	}
}

async function ensureNodeModules() {
	if (!(await exists('node_modules'))) {
		await runProcess(npm, ['ci']);
	}
}

async function getElectron() {
	// `npm run electron` deletes and re-downloads `.build/electron` on every
	// invocation. When preLaunch runs repeatedly (e.g. once per integration test
	// section) this is both wasteful and a source of flaky failures on Windows,
	// where the just-exited Electron process can still hold file locks while the
	// directory is being removed and re-extracted. Skip the refresh when the
	// already-present Electron matches the expected version; any detection
	// failure falls back to a (re)download to preserve the previous behavior.
	if (await isExpectedElectronInstalled()) {
		return;
	}
	await runProcess(npm, ['run', 'electron']);
}

async function isExpectedElectronInstalled(): Promise<boolean> {
	try {
		const { getElectronVersion } = await import('./util.ts');
		const { electronVersion } = getElectronVersion();
		const installedVersion = (await fs.readFile(path.join(rootDir, '.build', 'electron', 'version'), 'utf8')).trim().replace(/^v/, '');
		return installedVersion === electronVersion;
	} catch {
		return false;
	}
}

async function ensureCompiled() {
	// A client-only transpile leaves `out/` behind but does not build the
	// built-in extensions. Starting from that state used to produce a working
	// window with extension activation failures as soon as a supported file was
	// opened. Keep the development launcher honest by checking the extension
	// entrypoints that back the Agent's core editing and provider workflows.
	const requiredOutputs = [
		'out',
		'extensions/batikcode-provider-hub/out/extension.js',
		'extensions/github/out/extension.js',
		'extensions/html-language-features/client/out/node/htmlClientMain.js',
		'extensions/json-language-features/client/out/node/jsonClientMain.js',
		'extensions/markdown-language-features/out/extension.js',
		'extensions/npm/out/npmMain.js',
		'extensions/simple-browser/out/extension.js',
		'extensions/typescript-language-features/out/extension.js',
	];

	if (!(await Promise.all(requiredOutputs.map(exists))).every(Boolean)) {
		await runProcess(npm, ['run', 'build-fast']);
	}
}

async function main() {
	await ensureNodeModules();
	await getElectron();
	await ensureCompiled();

	// Can't require this until after dependencies are installed
	const { getBuiltInExtensions } = await import('./builtInExtensions.ts');
	await getBuiltInExtensions();
}

if (import.meta.main) {
	main().catch(err => {
		console.error(err);
		process.exit(1);
	});
}
