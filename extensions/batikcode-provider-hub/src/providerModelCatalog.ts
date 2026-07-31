/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

const MODEL_STATE_KEY = 'batikcode.providerModels.catalog';

interface StoredModelCatalog {
	readonly [providerId: string]: readonly string[];
}

export class ProviderModelCatalog implements vscode.Disposable {
	private readonly changeEmitter = new vscode.EventEmitter<void>();
	public readonly onDidChange = this.changeEmitter.event;

	public constructor(private readonly context: vscode.ExtensionContext) {
		context.subscriptions.push(this);
	}

	public dispose(): void {
		this.changeEmitter.dispose();
	}

	public getModels(providerId: string, fallback: readonly string[] = []): readonly string[] {
		const configured = this.context.globalState.get<StoredModelCatalog>(MODEL_STATE_KEY, {})[providerId] ?? [];
		return normalizeModels(configured.length ? configured : fallback);
	}

	public async configure(providerId: string, providerName: string, fallback: readonly string[] = []): Promise<void> {
		const current = this.getModels(providerId, fallback);
		const value = await vscode.window.showInputBox({
			title: `${providerName} models`,
			value: current.join(', '),
			prompt: 'Enter model IDs separated by commas or spaces. The first model is the primary/default.',
			ignoreFocusOut: true,
			validateInput: input => normalizeModels(input.split(/[\s,]+/)).length ? undefined : 'Enter at least one model ID.'
		});
		if (value === undefined) {
			return;
		}
		await this.setModels(providerId, value.split(/[\s,]+/));
		void vscode.window.showInformationMessage(`${providerName}: ${this.getModels(providerId).length} models available in Chat Models.`);
	}

	public async mergeModels(providerId: string, models: readonly string[], fallback: readonly string[] = []): Promise<readonly string[]> {
		const merged = normalizeModels([...this.getModels(providerId, fallback), ...models]);
		await this.setModels(providerId, merged);
		return merged;
	}

	public async clear(providerId: string): Promise<void> {
		const state = { ...this.context.globalState.get<StoredModelCatalog>(MODEL_STATE_KEY, {}) };
		delete state[providerId];
		await this.context.globalState.update(MODEL_STATE_KEY, state);
		this.changeEmitter.fire();
	}

	private async setModels(providerId: string, models: readonly string[]): Promise<void> {
		const normalized = normalizeModels(models);
		await this.context.globalState.update(MODEL_STATE_KEY, {
			...this.context.globalState.get<StoredModelCatalog>(MODEL_STATE_KEY, {}),
			[providerId]: normalized
		});
		this.changeEmitter.fire();
	}
}

export function normalizeModels(models: readonly string[]): string[] {
	return [...new Set(models.map(model => model.trim()).filter(Boolean))];
}
