/**
 * Shared catalogue types and formatting.
 *
 * No clothing data lives here: styles, prices, colours, sizes and stock all come from the
 * database (see src/lib/server/catalogue.ts) so she can manage them without code changes.
 */
import type { colours, sizes, styles, Piece } from '#lib/server/db/schema.ts';

export type { Piece };
export type Style = Pick<typeof styles.$inferSelect, 'id' | 'name' | 'price'>;
export type Colour = Pick<typeof colours.$inferSelect, 'id' | 'name' | 'hex'>;
export type Size = (typeof sizes.$inferSelect)['id'];

export type Catalogue = {
	styles: Style[];
	colours: Colour[];
	sizes: Size[];
	/** Pieces left, keyed by stockKey(). A missing key means none left. */
	stock: Record<string, number>;
};

export const stockKey = (colourId: string, piece: Piece, size: Size) =>
	`${colourId}:${piece}:${size}`;

/** Store currency. A shop setting rather than a clothing property, so it stays in code. */
export const CURRENCY = 'ZAR';
