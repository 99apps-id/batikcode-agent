/*---------------------------------------------------------------------------------------------
 *  Copyright (c) BatikCode contributors. All rights reserved.
 *  Licensed under the MIT License.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { MotifId, MOTIFS, SPECIES, speciesById, SpeciesId } from './pets';

const VIEW_ID = 'batikcode.pet.view';

export function activate(context: vscode.ExtensionContext): void {
	const provider = new PetViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(VIEW_ID, provider),
		vscode.commands.registerCommand('batikcode.pet.choose', () => choosePet()),
		vscode.commands.registerCommand('batikcode.pet.feed', () => provider.feed()),
		vscode.workspace.onDidChangeConfiguration(event => {
			if (event.affectsConfiguration('batikcode.pet')) {
				provider.refresh();
			}
		})
	);
}

async function choosePet(): Promise<void> {
	const configuration = vscode.workspace.getConfiguration('batikcode.pet');
	const current = configuration.get<string>('species', 'komodo');
	const picked = await vscode.window.showQuickPick(
		SPECIES.map(species => ({
			label: species.label,
			description: species.origin,
			picked: species.id === current,
			id: species.id
		})),
		{ title: 'BatikCode Pet', placeHolder: 'Pick a companion' }
	);
	if (picked) {
		await configuration.update('species', picked.id, vscode.ConfigurationTarget.Global);
	}
}

class PetViewProvider implements vscode.WebviewViewProvider {
	private view: vscode.WebviewView | undefined;

	public constructor(private readonly extensionUri: vscode.Uri) { }

	public resolveWebviewView(view: vscode.WebviewView): void {
		this.view = view;
		view.webview.options = { enableScripts: true, localResourceRoots: [this.extensionUri] };
		this.refresh();
	}

	/** Nudges the pet into its happy animation. Silently ignored when hidden. */
	public feed(): void {
		void this.view?.webview.postMessage({ type: 'feed' });
	}

	public refresh(): void {
		if (!this.view) {
			return;
		}
		const configuration = vscode.workspace.getConfiguration('batikcode.pet');
		this.view.webview.html = renderPet(
			configuration.get<SpeciesId>('species', 'komodo'),
			configuration.get<MotifId>('motif', 'kawung')
		);
	}
}

function renderPet(speciesId: SpeciesId, motifId: MotifId): string {
	const species = speciesById(speciesId);
	const motif = MOTIFS[motifId] ?? MOTIFS.kawung;
	// A nonce is required because the CSP forbids inline script without one.
	const nonce = Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join('');

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy"
	content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>
	body {
		margin: 0;
		height: 100vh;
		overflow: hidden;
		background: var(--vscode-panel-background);
		color: var(--vscode-descriptionForeground);
		font-family: var(--vscode-font-family);
		font-size: var(--vscode-font-size);
	}

	/* The ground carries the same motif as the pet, so the two read as one
	   scene rather than a sprite pasted onto a background. */
	.ground {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 34px;
		border-top: 1px solid var(--vscode-panel-border);
		color: ${species.accent};
		opacity: 0.5;
	}

	.stage { position: absolute; inset: 0; }

	/* Two nested animations: the track carries the pet across the panel and
	   flips it at each end, while the body bobs. Keeping them separate means the
	   bob survives the horizontal flip instead of being mirrored with it. */
	.track {
		position: absolute;
		bottom: 18px;
		width: 84px;
		height: 84px;
		animation: stroll ${species.pace}s linear infinite alternate;
	}

	.pet {
		width: 100%;
		height: 100%;
		color: ${species.accent};
		animation: bob ${(species.pace / 6).toFixed(2)}s ease-in-out infinite;
		transform-origin: 50% 90%;
	}

	body.happy .pet { animation: cheer 0.5s ease-in-out 3; }

	@keyframes stroll {
		from { left: 4%; transform: scaleX(1); }
		49.9% { transform: scaleX(1); }
		50% { transform: scaleX(-1); }
		to { left: calc(96% - 84px); transform: scaleX(-1); }
	}

	@keyframes bob {
		0%, 100% { transform: translateY(0) rotate(0deg); }
		50% { transform: translateY(-3px) rotate(-1.5deg); }
	}

	@keyframes cheer {
		0%, 100% { transform: translateY(0) scale(1); }
		40% { transform: translateY(-14px) scale(1.06); }
	}

	.caption {
		position: absolute;
		top: 8px;
		left: 0;
		right: 0;
		text-align: center;
		opacity: 0.65;
	}

	/* The pet is decoration; motion here carries no information, so it stops
	   entirely rather than degrading. */
	@media (prefers-reduced-motion: reduce) {
		.track, .pet, body.happy .pet { animation: none; }
		.track { left: 50%; margin-left: -42px; }
	}
</style>
</head>
<body>
	<div class="caption">${escapeHtml(species.label)} · ${escapeHtml(species.origin)}</div>
	<div class="stage">
		<div class="track">
			<svg class="pet" viewBox="0 0 100 100" aria-label="${escapeHtml(species.label)}">
				<defs>
					<pattern id="motif" width="24" height="24" patternUnits="userSpaceOnUse">
						${motif.tile}
					</pattern>
					<clipPath id="silhouette">${species.body}</clipPath>
				</defs>
				<g fill="${species.coat}">${species.body}</g>
				<g clip-path="url(#silhouette)" opacity="0.5">
					<rect width="100" height="100" fill="url(#motif)"/>
				</g>
			</svg>
		</div>
	</div>
	<svg class="ground" viewBox="0 0 240 34" preserveAspectRatio="none" aria-hidden="true">
		<defs>
			<pattern id="groundMotif" width="24" height="24" patternUnits="userSpaceOnUse">
				${motif.tile}
			</pattern>
		</defs>
		<rect width="240" height="34" fill="url(#groundMotif)"/>
	</svg>
	<script nonce="${nonce}">
		window.addEventListener('message', event => {
			if (event.data?.type !== 'feed') { return; }
			document.body.classList.remove('happy');
			// Force a reflow so the animation restarts when fed twice in a row.
			void document.body.offsetWidth;
			document.body.classList.add('happy');
		});
	</script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
