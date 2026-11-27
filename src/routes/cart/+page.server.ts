import { fail } from '@sveltejs/kit';
import { getCatalogue } from '#lib/server/catalogue.ts';
import { db } from '#lib/server/db/index.ts';
import { sendOrderEmails } from '#lib/server/email/send.ts';
import {
	getUpcomingPopups,
	OrderError,
	placeOrder,
	type OrderItemInput
} from '#lib/server/orders.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const database = db();
	const [catalogue, popups] = await Promise.all([
		getCatalogue(database),
		getUpcomingPopups(database)
	]);
	return { catalogue, popups };
};

const MAX_ITEMS = 20;

/** The bag arrives as JSON from the browser, so check its shape before using it. */
function parseItems(raw: FormDataEntryValue | null): OrderItemInput[] | null {
	if (typeof raw !== 'string') return null;
	let value: unknown;
	try {
		value = JSON.parse(raw);
	} catch {
		return null;
	}
	if (!Array.isArray(value) || value.length === 0 || value.length > MAX_ITEMS) return null;

	const items: OrderItemInput[] = [];
	for (const v of value as Record<string, unknown>[]) {
		const strings = ['styleId', 'topColour', 'topSize', 'bottomColour', 'bottomSize'] as const;
		if (!v || strings.some((k) => typeof v[k] !== 'string')) return null;
		if (typeof v.quantity !== 'number') return null;
		items.push({
			styleId: v.styleId as string,
			topColour: v.topColour as string,
			topSize: v.topSize as string,
			bottomColour: v.bottomColour as string,
			bottomSize: v.bottomSize as string,
			quantity: v.quantity
		});
	}
	return items;
}

export const actions: Actions = {
	checkout: async ({ request }) => {
		const form = await request.formData();
		const text = (key: string) => {
			const value = form.get(key);
			return typeof value === 'string' ? value.trim() : '';
		};
		const email = text('email');
		const name = text('name');
		const popupId = Number(form.get('popupId'));
		const values = { email, name, popupId };

		const items = parseItems(form.get('items'));
		if (!items)
			return fail(400, { error: 'Your bag looks empty or out of date. Please refresh.', values });
		if (!email) return fail(400, { error: 'Please enter your email address.', values });
		if (!Number.isInteger(popupId) || popupId <= 0) {
			return fail(400, { error: 'Please choose where you’ll collect your order.', values });
		}

		let order;
		try {
			order = await placeOrder(db(), { email, name: name || undefined, popupId, items });
		} catch (e) {
			if (e instanceof OrderError) return fail(400, { error: e.message, values });
			throw e;
		}

		const { customerSent } = await sendOrderEmails(order);

		return {
			success: true as const,
			reference: order.reference,
			email: order.customer.email,
			popup: {
				eventName: order.popup.eventName,
				eventDate: order.popup.eventDate,
				mapsUrl: order.popup.mapsUrl
			},
			emailSent: customerSent
		};
	}
};
