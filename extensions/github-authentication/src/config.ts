/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { workspace } from 'vscode';
import { resolveGitHubClientId } from './githubOAuthConfig';

export interface IConfig {
	// The client ID of the GitHub OAuth app
	gitHubClientId: string;
	gitHubClientSecret?: string;
}

let clientIdOverride: string | undefined;
let clientSecretOverride: string | undefined;

function configuredClientId(): string {
	return resolveGitHubClientId(
		typeof process !== 'undefined' ? process.env.BATIKCODE_GITHUB_CLIENT_ID : undefined,
		workspace.getConfiguration('batikcode.githubOAuth').get<string>('clientId', '')
	);
}

/**
 * Desktop authentication defaults to GitHub's device flow, so a client secret
 * is not shipped in the application. Sign-in uses the BatikCode-owned OAuth
 * App by default; environment and user configuration override it for forks and
 * private builds.
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
