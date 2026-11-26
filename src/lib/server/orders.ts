import { and, asc, eq, gte, inArray, sql } from 'drizzle-orm';
import { CURRENCY, type Size } from '#lib/catalogue.ts';
import type { getDb } from './db/index.ts';
import { colours, customers, orderItems, orders, popups, sizes, styles } from './db/schema.ts';

type Db = ReturnType<typeof getDb>;

export type OrderItemInput = {
	/** Ids from the styles / colours / sizes tables. */
	styleId: string;
	topColour: string;
	topSize: Size;
	bottomColour: string;
	bottomSize: Size;
	quantity: number;
	notes?: string;
};

export type PlaceOrderInput = {
	email: string;
	name?: string;
	popupId: number;
	items: OrderItemInput[];
};

/** Everything about a placed order, with names resolved from the database. Used for emails. */
export type OrderSummary = {
	reference: string;
	total: number;
	currency: string;
	customer: { email: string; name: string | null };
	popup: typeof popups.$inferSelect;
	items: {
		styleName: string;
		topColour: string;
		topSize: Size;
		bottomColour: string;
		bottomSize: Size;
		quantity: number;
		unitPrice: number;
		notes: string | null;
	}[];
};

export type OrderErrorCode =
	'invalid_input' | 'invalid_email' | 'out_of_stock' | 'popup_closed' | 'popup_full' | 'unknown';

const MESSAGES: Record<OrderErrorCode, string> = {
	invalid_input: 'Some of your order details are missing or invalid.',
	invalid_email: 'Please enter a valid email address.',
	out_of_stock: 'Sorry, one of the colours or sizes in your bag has just sold out.',
	popup_closed: 'Orders for that pop-up are closed. Please choose another date.',
	popup_full: 'That pop-up is fully booked. Please choose another date.',
	unknown: 'Something went wrong placing your order. Please try again.'
};

export class OrderError extends Error {
	code: OrderErrorCode;

	constructor(code: OrderErrorCode, detail?: string) {
		super(detail ? `${MESSAGES[code]} (${detail})` : MESSAGES[code]);
		this.code = code;
	}
}

/**
 * Pop-ups taking orders today or later, soonest first, leaving out fully booked ones.
 * `spotsLeft` is null when the pop-up has no order limit.
 */
export async function getUpcomingPopups(db: Db) {
	const rows = await db
		.select({
			id: popups.id,
			eventName: popups.eventName,
			eventDate: popups.eventDate,
			mapsUrl: popups.mapsUrl,
			eventUrl: popups.eventUrl,
			spotsLeft: sql<number | null>`CASE WHEN ${popups.maxOrders} IS NULL THEN NULL
				ELSE ${popups.maxOrders} - (SELECT count(*) FROM ${orders}
					WHERE ${orders.popupId} = ${popups.id} AND ${orders.status} != 'cancelled') END`
		})
		.from(popups)
		.where(and(eq(popups.ordersOpen, true), gte(popups.eventDate, sql`date('now')`)))
		.orderBy(asc(popups.eventDate));
	return rows.filter((p) => p.spotsLeft === null || p.spotsLeft > 0);
}

/**
 * Places an order in a single atomic D1 batch.
 *
 * Stock, pop-up capacity and status history are enforced by database triggers
 * (drizzle/0001_triggers.sql); if any check fails the whole batch is rolled back.
 * Styles, colours and sizes must be active in the database, and prices always come from the
 * `styles` table, never from the client.
 */
export async function placeOrder(db: Db, input: PlaceOrderInput): Promise<OrderSummary> {
	const email = input.email?.trim().toLowerCase();
	const name = input.name?.trim() || null;

	if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		throw new OrderError('invalid_email');
	}
	if (!Number.isInteger(input.popupId)) throw new OrderError('invalid_input', 'pop-up');
	if (!input.items?.length) throw new OrderError('invalid_input', 'empty order');

	for (const item of input.items) {
		if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
			throw new OrderError('invalid_input', 'quantity');
		}
	}

	// Look up everything the order uses; anything missing or inactive can't be ordered.
	const unique = <T>(values: T[]) => [...new Set(values)];
	const styleIds = unique(input.items.map((i) => i.styleId));
	const colourIds = unique(input.items.flatMap((i) => [i.topColour, i.bottomColour]));
	const sizeIds = unique(input.items.flatMap((i) => [i.topSize, i.bottomSize]));

	const [styleRows, colourRows, sizeRows] = await db.batch([
		db
			.select({ id: styles.id, name: styles.name, price: styles.price })
			.from(styles)
			.where(and(inArray(styles.id, styleIds), eq(styles.active, true))),
		db
			.select({ id: colours.id, name: colours.name })
			.from(colours)
			.where(and(inArray(colours.id, colourIds), eq(colours.active, true))),
		db
			.select({ id: sizes.id })
			.from(sizes)
			.where(and(inArray(sizes.id, sizeIds), eq(sizes.active, true)))
	]);
	if (colourRows.length !== colourIds.length || sizeRows.length !== sizeIds.length) {
		throw new OrderError('out_of_stock');
	}
	const priceOf = new Map(styleRows.map((s) => [s.id, s.price]));
	if (priceOf.size !== styleIds.length) throw new OrderError('out_of_stock');
	const unitPrice = (item: OrderItemInput) => priceOf.get(item.styleId) ?? 0;

	const [popup] = await db.select().from(popups).where(eq(popups.id, input.popupId));
	const today = new Date().toISOString().slice(0, 10);
	if (!popup || popup.eventDate < today) throw new OrderError('popup_closed');

	const total = input.items.reduce((sum, i) => sum + unitPrice(i) * i.quantity, 0);

	// Retry only on the (very unlikely) event of a duplicate order reference.
	for (let attempt = 0; attempt < 3; attempt++) {
		const reference = generateReference();
		const orderId = sql`(SELECT id FROM ${orders} WHERE ${orders.reference} = ${reference})`;

		try {
			await db.batch([
				db
					.insert(customers)
					.values({ email, name })
					.onConflictDoUpdate({
						target: customers.email,
						set: { name: sql`coalesce(excluded.name, ${customers.name})` }
					}),
				db.insert(orders).values({
					reference,
					customerId: sql`(SELECT id FROM ${customers} WHERE ${customers.email} = ${email})`,
					popupId: input.popupId,
					total,
					currency: CURRENCY
				}),
				db.insert(orderItems).values(
					input.items.map((item) => ({
						orderId,
						styleId: item.styleId,
						topColourId: item.topColour,
						topSize: item.topSize,
						bottomColourId: item.bottomColour,
						bottomSize: item.bottomSize,
						quantity: item.quantity,
						unitPrice: unitPrice(item),
						notes: item.notes?.trim() || null
					}))
				)
			]);
			const styleById = new Map(styleRows.map((s) => [s.id, s]));
			const colourName = new Map(colourRows.map((c) => [c.id, c.name]));
			return {
				reference,
				total,
				currency: CURRENCY,
				customer: { email, name },
				popup,
				items: input.items.map((item) => ({
					styleName: styleById.get(item.styleId)?.name ?? item.styleId,
					topColour: colourName.get(item.topColour) ?? item.topColour,
					topSize: item.topSize,
					bottomColour: colourName.get(item.bottomColour) ?? item.bottomColour,
					bottomSize: item.bottomSize,
					quantity: item.quantity,
					unitPrice: unitPrice(item),
					notes: item.notes?.trim() || null
				}))
			};
		} catch (e) {
			const message = errorMessage(e);
			if (message.includes('orders.reference')) continue;
			throw toOrderError(message, e);
		}
	}
	throw new OrderError('unknown', 'could not generate a unique reference');
}

function toOrderError(message: string, cause: unknown) {
	for (const code of ['out_of_stock', 'popup_closed', 'popup_full'] as const) {
		if (message.includes(code)) return new OrderError(code);
	}
	// stock_quantity_non_negative can fire when two items draw on the same stock row.
	if (message.includes('stock_quantity_non_negative')) return new OrderError('out_of_stock');
	console.error('placeOrder failed', cause);
	return new OrderError('unknown');
}

function errorMessage(e: unknown): string {
	// D1 wraps the SQLite error; include any nested cause messages.
	let message = '';
	for (let err = e; err instanceof Error; err = err.cause) message += ` ${err.message}`;
	return message;
}

/** e.g. 'AS-7K3Q9P'. Avoids look-alike characters (0/O, 1/I/L) so it's easy to read out at a stand. */
function generateReference() {
	const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
	const bytes = crypto.getRandomValues(new Uint8Array(6));
	return 'AS-' + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}
