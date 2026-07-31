/*---------------------------------------------------------------------------------------------
 *  Copyright (c) BatikCode contributors. All rights reserved.
 *  Licensed under the MIT License.
 *--------------------------------------------------------------------------------------------*/

export function openAiChatCompletionsUrl(providerId: string, endpoint: string, model: string): string {
	if (providerId !== 'azure') {
		return `${endpoint}/chat/completions`;
	}
	const url = new URL(endpoint);
	const deploymentSegment = '/openai/deployments/';
	if (!url.pathname.toLowerCase().includes(deploymentSegment)) {
		url.pathname = `${url.pathname.replace(/\/+$/, '')}/openai/deployments/${encodeURIComponent(model)}/chat/completions`;
	} else if (!url.pathname.toLowerCase().endsWith('/chat/completions')) {
		url.pathname = `${url.pathname.replace(/\/+$/, '')}/chat/completions`;
	}
	if (!url.searchParams.has('api-version')) {
		url.searchParams.set('api-version', '2024-10-21');
	}
	return url.toString();
}

export function isVisionModel(model: string): boolean {
	return /vision|vlm|(?:^|[-_/])vl(?:[-_/]|$)|llava|pixtral/i.test(model);
}
