import { browser } from '$app/env';
import type { Size, Style } from '#lib/data/catalogue.ts';

export type CartItem = {
	/** Unique per combination of options, so the same bikini in two colours is two lines. */
	key: string;
	style: Style;
	/** Colour ids from the catalogue. */
	topColour: string;
	bottomColour: string;
	topSize: Size;
	bottomSize: Size;
	notes: string;
	price: number;
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
	subtotal = $derived(this.items.reduce((n, i) => n + i.price * i.quantity, 0));

	constructor() {
		if (!browser) return;
		try {
			// Drop anything saved in an older shape.
			const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as CartItem[];
			this.items = saved.filter((i) => i.style && i.topColour && i.bottomColour);
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
			item.style,
			item.topColour,
			item.bottomColour,
			item.topSize,
			item.bottomSize,
			item.notes
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
