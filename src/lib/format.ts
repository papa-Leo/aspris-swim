import { CURRENCY } from './catalogue.ts';

/** 7500 → "R 75,00". Prices are stored in cents. */
export function formatPrice(minor: number) {
	return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: CURRENCY }).format(
		minor / 100
	);
}

/** '2026-12-13' → "Sunday, 13 December 2026". Event dates are plain dates, so format in UTC. */
export function formatEventDate(date: string) {
	return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-ZA', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC'
	});
}
