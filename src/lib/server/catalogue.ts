import { and, asc, eq } from 'drizzle-orm';
import { stockKey, type Catalogue } from '#lib/catalogue.ts';
import type { getDb } from './db/index.ts';
import { colours, sizes, stock, styles } from './db/schema.ts';

type Db = ReturnType<typeof getDb>;

/** Everything the builder and bag need: active styles, colours and sizes, plus stock levels. */
export async function getCatalogue(db: Db): Promise<Catalogue> {
	const [styleRows, colourRows, sizeRows, stockRows] = await db.batch([
		db
			.select({ id: styles.id, name: styles.name, price: styles.price })
			.from(styles)
			.where(eq(styles.active, true))
			.orderBy(asc(styles.sortOrder), asc(styles.name)),
		db
			.select({ id: colours.id, name: colours.name, hex: colours.hex })
			.from(colours)
			.where(eq(colours.active, true))
			.orderBy(asc(colours.sortOrder), asc(colours.name)),
		db
			.select({ id: sizes.id })
			.from(sizes)
			.where(eq(sizes.active, true))
			.orderBy(asc(sizes.sortOrder)),
		db
			.select({
				colourId: stock.colourId,
				piece: stock.piece,
				size: stock.size,
				quantity: stock.quantity
			})
			.from(stock)
			.innerJoin(colours, eq(colours.id, stock.colourId))
			.innerJoin(sizes, eq(sizes.id, stock.size))
			.where(and(eq(colours.active, true), eq(sizes.active, true)))
	]);

	const stockLevels: Record<string, number> = {};
	for (const row of stockRows) {
		stockLevels[stockKey(row.colourId, row.piece, row.size)] = row.quantity;
	}

	return {
		styles: styleRows,
		colours: colourRows,
		sizes: sizeRows.map((s) => s.id),
		stock: stockLevels
	};
}
