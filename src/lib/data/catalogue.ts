/**
 * Options for the custom bikini builder.
 *
 * Static placeholder data for now. When you're ready, move it into the D1 database
 * (see src/lib/server/db/schema.ts) so she can manage colours, styles and pricing herself.
 */

export type Colour = {
	id: string;
	name: string;
	hex: string;
};

export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL';

export const CURRENCY = 'ZAR';

// TODO: confirm the real price. Stored in minor units (cents) to avoid rounding issues.
export const CUSTOM_BIKINI_PRICE = 7500;

// TODO: confirm which styles she offers.
export const styles = ['Triangle', 'Bandeau', 'Scoop'] as const;
export type Style = (typeof styles)[number];

export const colours: Colour[] = [
	{ id: 'red', name: 'Red', hex: '#a3282f' },
	{ id: 'white', name: 'White', hex: '#f7f4ee' },
	{ id: 'black', name: 'Black', hex: '#1a1a1a' },
	{ id: 'navy', name: 'Navy', hex: '#172a4b' },
	{ id: 'brown', name: 'Brown', hex: '#7a523b' },
	{ id: 'rose', name: 'Rose', hex: '#b07f7b' }
];

export const sizes: Size[] = ['XS', 'S', 'M', 'L', 'XL'];

export function getColour(id: string) {
	return colours.find((c) => c.id === id);
}

export function formatPrice(minor: number) {
	return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: CURRENCY }).format(
		minor / 100
	);
}
