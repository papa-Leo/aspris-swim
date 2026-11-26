/**
 * Aspris Swim database schema (Cloudflare D1 / SQLite).
 *
 * Business rules are enforced by triggers in the database itself (see the `*_triggers`
 * migration in /drizzle), so they hold even when rows are edited by hand:
 *  - Adding an order item checks stock and decrements it; there is no overselling.
 *  - Placing an order checks the pop-up is open and under its `max_orders` cap.
 *  - Every status change is logged to `order_status_history`.
 *  - Cancelling an order puts its stock back. Un-cancelling is blocked (place a new order instead).
 *
 * Everything that describes the clothing (styles + prices, colours, sizes, stock) lives here in the
 * database, not in code: the builder, bag and checkout all read it via src/lib/server/catalogue.ts.
 *
 * Timestamps are UTC text ('YYYY-MM-DD HH:MM:SS') so they're readable when editing directly.
 */
import { sql } from 'drizzle-orm';
import {
	check,
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
	type AnySQLiteColumn
} from 'drizzle-orm/sqlite-core';
/** A bikini is always a top + a bottom; this is the product's structure, not editable data. */
export const PIECES = ['top', 'bottom'] as const;

/**
 * Order lifecycle. `cancelled` is terminal.
 * placed → confirmed → in_production → ready → collected
 */
export const ORDER_STATUSES = [
	'placed',
	'confirmed',
	'in_production',
	'ready',
	'collected',
	'cancelled'
] as const;

export type Piece = (typeof PIECES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Builds `"col" IN ('a', 'b', ...)` for CHECK constraints. Values are our own constants. */
const oneOf = (column: AnySQLiteColumn, values: readonly string[]) =>
	sql`${column} IN (${sql.raw(values.map((v) => `'${v}'`).join(', '))})`;

const createdAt = () =>
	text('created_at')
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`);

// ---------------------------------------------------------------------------------------------

export const customers = sqliteTable(
	'customers',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		/** Always stored lower-case so the same person never ends up with two rows. */
		email: text('email').notNull().unique(),
		name: text('name'),
		createdAt: createdAt()
	},
	(t) => [check('customers_email_lowercase', sql`${t.email} = lower(${t.email})`)]
);

export const popups = sqliteTable(
	'popups',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		eventName: text('event_name').notNull(),
		/** 'YYYY-MM-DD' */
		eventDate: text('event_date').notNull(),
		mapsUrl: text('maps_url').notNull(),
		eventUrl: text('event_url'),
		/** Max orders (excluding cancelled) that can be collected here. NULL = no limit. */
		maxOrders: integer('max_orders'),
		/** Set to 0 to stop new orders for this pop-up without deleting it. */
		ordersOpen: integer('orders_open', { mode: 'boolean' }).notNull().default(true),
		createdAt: createdAt()
	},
	(t) => [
		check('popups_event_date_format', sql`date(${t.eventDate}) IS ${t.eventDate}`),
		check('popups_max_orders_positive', sql`${t.maxOrders} IS NULL OR ${t.maxOrders} >= 0`),
		index('popups_event_date_idx').on(t.eventDate)
	]
);

// ── Catalogue ───────────────────────────────────────────────────────────────────────────────
// `active = 0` hides a row from the builder without deleting it (old orders still reference it).
// `sort_order` sets the display order in the builder (lowest first).

/** Bikini styles and their prices. `id` is a short slug, e.g. 'triangle'. */
export const styles = sqliteTable(
	'styles',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		/** Price of a bikini in this style, in cents. */
		price: integer('price').notNull(),
		sortOrder: integer('sort_order').notNull().default(0),
		active: integer('active', { mode: 'boolean' }).notNull().default(true)
	},
	(t) => [check('styles_price_non_negative', sql`${t.price} >= 0`)]
);

/** Fabric colours. `id` is a short slug, e.g. 'navy'; `hex` is the swatch colour. */
export const colours = sqliteTable(
	'colours',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		hex: text('hex').notNull(),
		sortOrder: integer('sort_order').notNull().default(0),
		active: integer('active', { mode: 'boolean' }).notNull().default(true)
	},
	(t) => [
		check(
			'colours_hex_format',
			// '#' + 6 hex digits. (D1 caps GLOB pattern length, so check the parts separately.)
			sql`length(${t.hex}) = 7 AND substr(${t.hex}, 1, 1) = '#' AND substr(${t.hex}, 2) NOT GLOB '*[^0-9a-fA-F]*'`
		)
	]
);

/** Sizes, used for both tops and bottoms. `id` is the label shown, e.g. 'XS'. */
export const sizes = sqliteTable('sizes', {
	id: text('id').primaryKey(),
	sortOrder: integer('sort_order').notNull().default(0),
	active: integer('active', { mode: 'boolean' }).notNull().default(true)
});

/**
 * How many of each piece can still be made, per colour and size.
 * A bikini uses one `top` row and one `bottom` row. A missing row counts as zero stock.
 */
export const stock = sqliteTable(
	'stock',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		colourId: text('colour_id')
			.notNull()
			.references(() => colours.id, { onUpdate: 'cascade' }),
		piece: text('piece', { enum: PIECES }).notNull(),
		size: text('size')
			.notNull()
			.references(() => sizes.id, { onUpdate: 'cascade' }),
		quantity: integer('quantity').notNull().default(0),
		updatedAt: text('updated_at')
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`)
	},
	(t) => [
		uniqueIndex('stock_colour_piece_size_idx').on(t.colourId, t.piece, t.size),
		check('stock_quantity_non_negative', sql`${t.quantity} >= 0`),
		check('stock_piece_valid', oneOf(t.piece, PIECES))
	]
);

export const orders = sqliteTable(
	'orders',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		/** Customer-facing order number, e.g. 'AS-7K3Q9P'. */
		reference: text('reference').notNull().unique(),
		customerId: integer('customer_id')
			.notNull()
			.references(() => customers.id),
		popupId: integer('popup_id')
			.notNull()
			.references(() => popups.id),
		status: text('status', { enum: ORDER_STATUSES }).notNull().default('placed'),
		/** Sum of item prices at the time of ordering, in cents. */
		total: integer('total').notNull(),
		/** Set from CURRENCY in src/lib/catalogue.ts when the order is placed. */
		currency: text('currency').notNull(),
		/** Internal notes for her; not shown to the customer. */
		adminNotes: text('admin_notes'),
		createdAt: createdAt(),
		/** Maintained by trigger whenever `status` changes. */
		statusUpdatedAt: text('status_updated_at')
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`)
	},
	(t) => [
		check('orders_status_valid', oneOf(t.status, ORDER_STATUSES)),
		check('orders_total_non_negative', sql`${t.total} >= 0`),
		index('orders_customer_idx').on(t.customerId),
		index('orders_popup_status_idx').on(t.popupId, t.status)
	]
);

export const orderItems = sqliteTable(
	'order_items',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		orderId: integer('order_id')
			.notNull()
			.references(() => orders.id, { onDelete: 'cascade' }),
		styleId: text('style_id')
			.notNull()
			.references(() => styles.id, { onUpdate: 'cascade' }),
		topColourId: text('top_colour_id')
			.notNull()
			.references(() => colours.id, { onUpdate: 'cascade' }),
		topSize: text('top_size')
			.notNull()
			.references(() => sizes.id, { onUpdate: 'cascade' }),
		bottomColourId: text('bottom_colour_id')
			.notNull()
			.references(() => colours.id, { onUpdate: 'cascade' }),
		bottomSize: text('bottom_size')
			.notNull()
			.references(() => sizes.id, { onUpdate: 'cascade' }),
		quantity: integer('quantity').notNull().default(1),
		/** The style's price when the order was placed, in cents (later price changes don't affect it). */
		unitPrice: integer('unit_price').notNull(),
		/** The customer's note from the builder (fit preferences etc). */
		notes: text('notes')
	},
	(t) => [
		check('order_items_quantity_positive', sql`${t.quantity} > 0`),
		index('order_items_order_idx').on(t.orderId)
	]
);

/** Written only by triggers: one row when an order is placed and one per status change. */
export const orderStatusHistory = sqliteTable(
	'order_status_history',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		orderId: integer('order_id')
			.notNull()
			.references(() => orders.id, { onDelete: 'cascade' }),
		fromStatus: text('from_status', { enum: ORDER_STATUSES }),
		toStatus: text('to_status', { enum: ORDER_STATUSES }).notNull(),
		changedAt: text('changed_at')
			.notNull()
			.default(sql`(CURRENT_TIMESTAMP)`)
	},
	(t) => [index('order_status_history_order_idx').on(t.orderId)]
);
