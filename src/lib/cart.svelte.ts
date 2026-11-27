import { browser } from '$app/env';
import type { Size } from '#lib/catalogue.ts';

export type CartItem = {
	/** Unique per combination of options, so the same bikini in two colours is two lines. */
	key: string;
	/**
	 * Ids from the database's styles / colours / sizes tables. Only the customer's choices are
	 * stored here; names and prices are looked up from the database whenever the bag is shown,
	 * so they're never stale.
	 */
	styleId: string;
	topColour: string;
	bottomColour: string;
	topSize: Size;
	bottomSize: Size;
	quantity: number;
};

const STORAGE_KEY = 'aspris-cart';

/**
 * Client-side cart, persisted to localStorage.
 * Swap the persistence for a server/D1-backed cart when checkout is built.
 */
class Cart {
	items = $state<CartItem[]>([]);

	count = $derived(this.items.reduce((n, i) => n + i.quantity, 0));

	constructor() {
		if (!browser) return;
		try {
			// Drop anything saved in an older shape.
			const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as CartItem[];
			this.items = saved.filter((i) => i.styleId && i.topColour && i.bottomColour);
		} catch {
			this.items = [];
		}
		$effect.root(() => {
			$effect(() => {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
			});
		});
	}

	add(item: Omit<CartItem, 'key' | 'quantity'>, quantity = 1) {
		const key = [
			item.styleId,
			item.topColour,
			item.bottomColour,
			item.topSize,
			item.bottomSize
		].join(':');
		const existing = this.items.find((i) => i.key === key);
		if (existing) existing.quantity += quantity;
		else this.items.push({ ...item, key, quantity });
	}

	setQuantity(key: string, quantity: number) {
		if (quantity <= 0) return this.remove(key);
		const item = this.items.find((i) => i.key === key);
		if (item) item.quantity = quantity;
	}

	remove(key: string) {
		this.items = this.items.filter((i) => i.key !== key);
	}

	clear() {
		this.items = [];
	}
}

export const cart = new Cart();
