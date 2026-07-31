/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { workspace } from 'vscode';

export interface IConfig {
	// The client ID of the GitHub OAuth app
	gitHubClientId: string;
	gitHubClientSecret?: string;
}

let clientIdOverride: string | undefined;
let clientSecretOverride: string | undefined;

// Temporary development fallback copied from the upstream Code - OSS GitHub
// authentication extension. Replace it with a BatikCode-owned OAuth client
// before distributing BatikCode outside the current private test group.
const microsoftVsCodeGitHubClientId = '01ab8ac9400c4e429b23';

function configuredClientId(): string {
	const environmentValue = typeof process !== 'undefined' ? process.env.BATIKCODE_GITHUB_CLIENT_ID?.trim() : undefined;
	return environmentValue
		|| workspace.getConfiguration('batikcode.githubOAuth').get<string>('clientId', '').trim()
		|| microsoftVsCodeGitHubClientId;
}

/**
 * Desktop authentication defaults to GitHub's device flow, so a client secret
 * is not shipped in the application. Environment and user configuration
 * override the temporary upstream development fallback.
 */
export const Config: IConfig = {
	get gitHubClientId(): string {
		return clientIdOverride ?? configuredClientId();
	},
	set gitHubClientId(value: string) {
		clientIdOverride = value;
	},
	get gitHubClientSecret(): string | undefined {
		return clientSecretOverride ?? (typeof process !== 'undefined' ? process.env.BATIKCODE_GITHUB_CLIENT_SECRET?.trim() || undefined : undefined);
	},
	set gitHubClientSecret(value: string | undefined) {
		clientSecretOverride = value;
	}
};
