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
	/**
	 * The silhouette, inside a 100×100 viewBox standing on y≈88.
	 *
	 * Recognition lives in the outline — the run of head into back into tail —
	 * so each animal is traced as a contour rather than assembled from ovals.
	 */
	readonly body: string;
	/**
	 * Markings drawn over the batik in the accent colour: an eye, a beak, the
	 * stripes. Small, but they are what turns a shape into a specific animal.
	 */
	readonly features: string;
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
		// Low slung, long snout, heavy tail carried behind — a monitor lizard is
		// read almost entirely from how far it stretches horizontally.
		body: `
			<path d="M30 62 Q17 66 3 53 Q5 70 28 71 Z"/>
			<path d="M97 63 Q90 55 78 52 Q60 46 44 50 Q32 53 27 60 Q25 67 34 71 Q50 77 66 76 Q82 74 92 69 Q98 66 97 63 Z"/>
			<path d="M71 73 Q75 81 71 88 L63 88 Q66 80 63 73 Z"/>
			<path d="M43 74 Q47 82 43 89 L35 89 Q38 81 35 74 Z"/>
			<ellipse cx="67" cy="88" rx="7" ry="2.6"/>
			<ellipse cx="39" cy="89" rx="7" ry="2.6"/>`,
		features: `
			<circle cx="85" cy="59" r="2.3"/>
			<path d="M97 64 Q99 64 100 63" stroke-width="1.4" fill="none" stroke="currentColor"/>`
	},
	{
		id: 'orangutan',
		label: 'Orangutan',
		origin: 'Kalimantan & Sumatra',
		coat: '#b4622f',
		accent: '#6d3316',
		pace: 7,
		// Facing us, because the cheek flanges and the arm span are the whole
		// point: arms longer than the body, reaching well past the knees.
		body: `
			<path d="M50 14 Q67 14 72 29 Q75 41 66 48 Q58 53 50 53 Q42 53 34 48 Q25 41 28 29 Q33 14 50 14 Z"/>
			<path d="M50 48 Q65 51 69 64 Q72 77 64 86 L36 86 Q28 77 31 64 Q35 51 50 48 Z"/>
			<path d="M33 51 Q19 56 17 71 Q16 83 24 90 L32 87 Q26 79 27 69 Q29 59 37 56 Z"/>
			<path d="M67 51 Q81 56 83 71 Q84 83 76 90 L68 87 Q74 79 73 69 Q71 59 63 56 Z"/>
			<ellipse cx="41" cy="88" rx="8" ry="4"/>
			<ellipse cx="59" cy="88" rx="8" ry="4"/>`,
		features: `
			<ellipse cx="50" cy="36" rx="12" ry="13" opacity="0.3"/>
			<circle cx="44" cy="33" r="2.1"/>
			<circle cx="56" cy="33" r="2.1"/>
			<path d="M44 44 Q50 48 56 44" stroke-width="1.8" fill="none" stroke="currentColor" stroke-linecap="round"/>`
	},
	{
		id: 'cendrawasih',
		label: 'Cendrawasih',
		origin: 'Papua',
		coat: '#d8a12a',
		accent: '#9a2f2f',
		pace: 4,
		// A small bird carrying an absurd tail: the plumes are longer than the
		// bird and sweep clear of the body, which is the whole silhouette.
		body: `
			<path d="M55 52 Q78 50 92 33 Q97 26 95 21 Q86 38 68 47 Q60 51 55 52 Z"/>
			<path d="M56 58 Q80 60 95 49 Q100 45 99 40 Q89 53 69 59 Q61 61 56 58 Z"/>
			<path d="M34 40 Q24 45 24 54 Q25 63 34 67 Q44 71 52 68 Q61 64 62 55 Q63 45 54 40 Q44 35 34 40 Z"/>
			<path d="M33 43 Q24 34 27 25 Q32 16 41 17 Q49 19 49 28 Q49 36 42 41 Z"/>
			<path d="M29 22 L12 26 L29 31 Z"/>
			<path d="M40 60 Q52 58 58 52 Q54 63 42 66 Z"/>
			<rect x="39" y="67" width="3.4" height="18" rx="1.7"/>
			<rect x="50" y="67" width="3.4" height="18" rx="1.7"/>
			<ellipse cx="40" cy="87" rx="7" ry="2.6"/>
			<ellipse cx="51" cy="87" rx="7" ry="2.6"/>`,
		features: `
			<circle cx="35" cy="26" r="2.2"/>
			<path d="M29 22 L12 26 L29 31 Z" opacity="0.55"/>`
	},
	{
		id: 'harimau',
		label: 'Harimau Sumatera',
		origin: 'Sumatra',
		coat: '#d8853a',
		accent: '#3a2412',
		pace: 4.5,
		// A cat in profile: deep chest, dipped back, high shoulder, and a tail
		// that curls up rather than trailing — that curl is what separates it
		// from the komodo at this size.
		body: `
			<path d="M23 60 Q11 58 5 46 Q2 37 7 33 Q6 44 14 52 Q19 57 25 57 Z"/>
			<path d="M26 58 Q33 49 48 47 Q63 45 74 50 Q83 54 85 62 Q85 71 74 74 Q56 78 41 76 Q28 73 26 65 Z"/>
			<path d="M72 55 Q70 43 79 38 Q90 34 95 42 Q98 50 94 57 Q88 63 79 61 Z"/>
			<path d="M76 40 L74 29 L84 36 Z"/>
			<path d="M94 41 L96 30 L88 36 Z"/>
			<path d="M69 74 Q73 82 69 89 L61 89 Q64 81 61 74 Z"/>
			<path d="M38 76 Q42 83 38 90 L30 90 Q33 82 30 76 Z"/>
			<ellipse cx="65" cy="89" rx="7" ry="2.8"/>
			<ellipse cx="34" cy="90" rx="7" ry="2.8"/>`,
		features: `
			<circle cx="86" cy="47" r="2.2"/>
			<g stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none">
				<path d="M62 49 Q60 56 61 63"/>
				<path d="M52 48 Q50 56 51 64"/>
				<path d="M42 49 Q40 56 41 64"/>
				<path d="M32 53 Q31 58 32 63"/>
			</g>`
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
