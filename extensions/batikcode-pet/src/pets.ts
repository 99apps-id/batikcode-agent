/*---------------------------------------------------------------------------------------------
 *  Copyright (c) BatikCode contributors. All rights reserved.
 *  Licensed under the MIT License.
 *--------------------------------------------------------------------------------------------*/

/**
 * The companions and the batik they wear.
 *
 * Everything is inline SVG built from theme tokens rather than image assets:
 * the webview runs under a strict CSP that blocks external hosts, and a pet
 * drawn from `currentColor` follows the user's theme instead of fighting it.
 */

export type SpeciesId = 'komodo' | 'orangutan' | 'cendrawasih' | 'harimau';
export type MotifId = 'kawung' | 'parang' | 'polos';

export interface Species {
	readonly id: SpeciesId;
	readonly label: string;
	/** Where the animal actually lives — shown when picking. */
	readonly origin: string;
	/** Body colour; the batik overlay is drawn on top of it. */
	readonly coat: string;
	readonly accent: string;
	/** Body SVG, drawn inside a 100×100 viewBox standing on y=82. */
	readonly body: string;
	/** Seconds for one full walk cycle. Heavier animals move slower. */
	readonly pace: number;
}

/** A seamless 24×24 batik tile, tinted by the species accent at low opacity. */
export const MOTIFS: Readonly<Record<MotifId, { readonly label: string; readonly tile: string }>> = {
	kawung: {
		label: 'Kawung',
		tile: `<g fill="none" stroke="currentColor" stroke-width="1">
			<ellipse cx="12" cy="12" rx="6" ry="5"/><ellipse cx="12" cy="12" rx="5" ry="6"/>
			<ellipse cx="0" cy="0" rx="6" ry="5"/><ellipse cx="24" cy="0" rx="6" ry="5"/>
			<ellipse cx="0" cy="24" rx="6" ry="5"/><ellipse cx="24" cy="24" rx="6" ry="5"/>
			<circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>
		</g>`
	},
	parang: {
		label: 'Parang',
		tile: `<g fill="none" stroke="currentColor" stroke-width="1.1">
			<path d="M-4 20 Q4 10 12 20 Q20 30 28 20"/>
			<path d="M-4 8 Q4 -2 12 8 Q20 18 28 8"/>
		</g>`
	},
	polos: {
		label: 'Plain',
		tile: ''
	}
};

export const SPECIES: readonly Species[] = [
	{
		id: 'komodo',
		label: 'Komodo',
		origin: 'Nusa Tenggara',
		coat: '#7d8a5c',
		accent: '#3f4a2a',
		pace: 5.5,
		body: `
			<path d="M14 74 Q6 70 4 62 Q10 64 16 68 Z"/>
			<ellipse cx="52" cy="68" rx="34" ry="14"/>
			<path d="M78 60 Q92 56 94 48 Q86 50 80 56 Z"/>
			<circle cx="84" cy="60" r="11"/>
			<rect x="30" y="78" width="7" height="10" rx="3"/>
			<rect x="46" y="79" width="7" height="9" rx="3"/>
			<rect x="64" y="78" width="7" height="10" rx="3"/>`
	},
	{
		id: 'orangutan',
		label: 'Orangutan',
		origin: 'Kalimantan & Sumatra',
		coat: '#b4622f',
		accent: '#6d3316',
		pace: 7,
		body: `
			<ellipse cx="50" cy="62" rx="24" ry="22"/>
			<circle cx="50" cy="34" r="16"/>
			<ellipse cx="50" cy="38" rx="9" ry="10" opacity="0.45"/>
			<ellipse cx="32" cy="31" rx="5" ry="7"/>
			<ellipse cx="68" cy="31" rx="5" ry="7"/>
			<rect x="22" y="52" width="9" height="26" rx="4.5"/>
			<rect x="69" y="52" width="9" height="26" rx="4.5"/>
			<rect x="38" y="80" width="10" height="8" rx="4"/>
			<rect x="52" y="80" width="10" height="8" rx="4"/>`
	},
	{
		id: 'cendrawasih',
		label: 'Cendrawasih',
		origin: 'Papua',
		coat: '#d8a12a',
		accent: '#9a2f2f',
		pace: 4,
		body: `
			<path d="M56 58 Q84 44 96 20 Q78 44 62 50 Z"/>
			<path d="M58 62 Q88 56 98 38 Q80 58 64 62 Z"/>
			<ellipse cx="46" cy="60" rx="20" ry="15"/>
			<circle cx="30" cy="48" r="10"/>
			<path d="M20 46 L8 49 L20 52 Z"/>
			<rect x="42" y="72" width="4" height="13" rx="2"/>
			<rect x="52" y="72" width="4" height="13" rx="2"/>`
	},
	{
		id: 'harimau',
		label: 'Harimau Sumatera',
		origin: 'Sumatra',
		coat: '#d8853a',
		accent: '#3a2412',
		pace: 4.5,
		body: `
			<path d="M16 66 Q4 60 2 48 Q10 54 18 62 Z"/>
			<ellipse cx="52" cy="64" rx="30" ry="16"/>
			<circle cx="82" cy="52" r="14"/>
			<path d="M72 40 L74 30 L81 38 Z"/>
			<path d="M92 40 L90 30 L83 38 Z"/>
			<rect x="30" y="76" width="8" height="12" rx="4"/>
			<rect x="46" y="77" width="8" height="11" rx="4"/>
			<rect x="64" y="76" width="8" height="12" rx="4"/>`
	}
];

export function speciesById(id: string): Species {
	return SPECIES.find(s => s.id === id) ?? SPECIES[0];
}

/**
 * What the pet is reacting to. Derived from the diagnostics the language
 * services already produce — the pet never parses code itself, so it stays
 * correct for every language without knowing any of them.
 */
export type Mood = 'calm' | 'watching' | 'alert' | 'happy';

export interface MoodState {
	readonly mood: Mood;
	readonly message: string;
}

export function moodFor(errors: number, warnings: number): MoodState {
	if (errors > 0) {
		return {
			mood: 'alert',
			message: errors === 1 ? '1 error' : `${errors} errors`
		};
	}
	if (warnings > 0) {
		return {
			mood: 'watching',
			message: warnings === 1 ? '1 warning' : `${warnings} warnings`
		};
	}
	return { mood: 'calm', message: 'all clear' };
}
