/**
 * Order email templates.
 *
 * Email clients ignore <style> blocks and modern CSS inconsistently, so the layout uses tables
 * and inline styles. Colours and fonts mirror the site theme in src/routes/layout.css
 * (emails can't read CSS variables, so keep the two in sync if the brand changes).
 */
import { formatEventDate, formatPrice } from '#lib/format.ts';
import type { OrderSummary } from '../orders.ts';

const theme = {
	cream: '#f8f1eb',
	sand: '#efe3d8',
	rose: '#b07f7b',
	roseDark: '#8e605c',
	ink: '#2e2624',
	muted: '#7a6e6b',
	card: '#fffbf8',
	serif: "'Caudex', Georgia, 'Times New Roman', serif",
	sans: "'Jost', 'Helvetica Neue', Helvetica, Arial, sans-serif"
};

/** Escape customer-provided text (names, notes) before putting it in HTML. */
function esc(value: string | null | undefined) {
	return (value ?? '').replace(
		/[&<>"']/g,
		(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
	);
}

// ── Building blocks ────────────────────────────────────────────────────────────────────────

function layout({ preheader, body }: { preheader: string; body: string }) {
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<link href="https://fonts.googleapis.com/css2?family=Caudex&family=Jost:wght@400;500&display=swap" rel="stylesheet">
<title>Aspris Swim</title>
</head>
<body style="margin:0;padding:0;background:${theme.cream};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${theme.cream};">
<tr><td align="center" style="padding:32px 16px;">
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
		<tr><td align="center" style="padding:8px 0 28px;">
			<div style="font-family:${theme.serif};font-size:30px;letter-spacing:0.35em;color:${theme.rose};padding-left:0.35em;">ASPRIS</div>
			<div style="font-family:${theme.sans};font-size:11px;letter-spacing:0.6em;color:${theme.rose};padding-left:0.6em;margin-top:4px;">SWIM</div>
		</td></tr>
		<tr><td style="background:${theme.card};border:1px solid ${theme.sand};border-radius:24px;padding:36px 32px;font-family:${theme.sans};font-size:15px;line-height:1.6;color:${theme.ink};">
			${body}
		</td></tr>
		<tr><td align="center" style="padding:24px 0;font-family:${theme.sans};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${theme.muted};">
			Aspris Swim · Made for you, in your colours
		</td></tr>
	</table>
</td></tr>
</table>
</body>
</html>`;
}

const heading = (text: string) =>
	`<h1 style="margin:0 0 12px;font-family:${theme.serif};font-weight:400;font-size:30px;line-height:1.2;color:${theme.ink};">${text}</h1>`;

const eyebrow = (text: string) =>
	`<div style="font-size:11px;font-weight:500;letter-spacing:0.3em;text-transform:uppercase;color:${theme.rose};margin:28px 0 10px;">${text}</div>`;

const button = (href: string, label: string) =>
	`<a href="${esc(href)}" style="display:inline-block;background:${theme.rose};color:${theme.cream};text-decoration:none;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;padding:12px 22px;border-radius:999px;margin:4px 8px 4px 0;">${label}</a>`;

function referenceBox(reference: string) {
	return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 4px;"><tr>
<td style="background:${theme.cream};border-radius:14px;padding:12px 18px;">
	<span style="font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:${theme.muted};">Order</span>
	<span style="font-family:${theme.serif};font-size:20px;letter-spacing:0.08em;color:${theme.ink};padding-left:10px;">${esc(reference)}</span>
</td></tr></table>`;
}

function itemsTable(order: OrderSummary) {
	const rows = order.items
		.map(
			(item) => `<tr>
<td style="padding:14px 0;border-bottom:1px solid ${theme.sand};vertical-align:top;">
	<div style="font-family:${theme.serif};font-size:18px;color:${theme.ink};">${esc(item.styleName)} bikini${item.quantity > 1 ? ` × ${item.quantity}` : ''}</div>
	<div style="font-size:13px;color:${theme.muted};margin-top:2px;">Top: ${esc(item.topColour)}, ${esc(item.topSize)} · Bottom: ${esc(item.bottomColour)}, ${esc(item.bottomSize)}</div>
	${item.notes ? `<div style="font-size:13px;color:${theme.muted};font-style:italic;margin-top:4px;">“${esc(item.notes)}”</div>` : ''}
</td>
<td align="right" style="padding:14px 0 14px 16px;border-bottom:1px solid ${theme.sand};vertical-align:top;white-space:nowrap;">${formatPrice(item.unitPrice * item.quantity)}</td>
</tr>`
		)
		.join('');
	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${theme.sand};">
${rows}
<tr>
	<td style="padding:16px 0 0;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;color:${theme.muted};">Total</td>
	<td align="right" style="padding:16px 0 0;font-family:${theme.serif};font-size:22px;color:${theme.ink};white-space:nowrap;">${formatPrice(order.total)}</td>
</tr>
</table>`;
}

function popupBlock(order: OrderSummary, { withButtons }: { withButtons: boolean }) {
	const { popup } = order;
	return `<div style="background:${theme.cream};border-radius:16px;padding:18px 20px;">
	<div style="font-family:${theme.serif};font-size:20px;color:${theme.ink};">${esc(popup.eventName)}</div>
	<div style="font-size:14px;color:${theme.muted};margin-top:2px;">${formatEventDate(popup.eventDate)}</div>
	${
		withButtons
			? `<div style="margin-top:14px;">${button(popup.mapsUrl, 'Directions')}${popup.eventUrl ? button(popup.eventUrl, 'Event details') : ''}</div>`
			: `<div style="font-size:13px;margin-top:8px;"><a href="${esc(popup.mapsUrl)}" style="color:${theme.roseDark};">Map</a>${popup.eventUrl ? ` · <a href="${esc(popup.eventUrl)}" style="color:${theme.roseDark};">Event page</a>` : ''}</div>`
	}
</div>`;
}

function itemsText(order: OrderSummary) {
	return order.items
		.map(
			(i) =>
				`- ${i.styleName} bikini${i.quantity > 1 ? ` x${i.quantity}` : ''} (${formatPrice(i.unitPrice * i.quantity)})\n` +
				`  Top: ${i.topColour}, ${i.topSize} / Bottom: ${i.bottomColour}, ${i.bottomSize}` +
				(i.notes ? `\n  Note: "${i.notes}"` : '')
		)
		.join('\n');
}

// ── Emails ─────────────────────────────────────────────────────────────────────────────────

export function customerConfirmation(order: OrderSummary) {
	const { popup, customer } = order;
	const date = formatEventDate(popup.eventDate);
	const greeting = customer.name ? `Thank you, ${esc(customer.name)}.` : 'Thank you.';

	const html = layout({
		preheader: `Order ${order.reference} confirmed — collect it at ${popup.eventName} on ${date}.`,
		body: `${heading(greeting)}
<p style="margin:0;">Your order is in. Every piece is made just for you, and we'll have it ready to collect at the pop-up you chose.</p>
${referenceBox(order.reference)}
${eyebrow('Your order')}
${itemsTable(order)}
${eyebrow('Collect it at')}
${popupBlock(order, { withButtons: true })}
<p style="margin:28px 0 0;font-size:14px;color:${theme.muted};">Questions about your order? Just reply to this email and quote <strong style="color:${theme.ink};">${esc(order.reference)}</strong>.</p>`
	});

	const text = `${customer.name ? `Thank you, ${customer.name}.` : 'Thank you.'}

Your order is in. Every piece is made just for you, and we'll have it ready to collect at the pop-up you chose.

Order: ${order.reference}

${itemsText(order)}

Total: ${formatPrice(order.total)}

Collect it at: ${popup.eventName}, ${date}
Directions: ${popup.mapsUrl}${popup.eventUrl ? `\nEvent details: ${popup.eventUrl}` : ''}

Questions? Just reply to this email and quote ${order.reference}.

Aspris Swim`;

	return { subject: `Your Aspris Swim order ${order.reference}`, html, text };
}

export function ownerNotification(order: OrderSummary) {
	const { popup, customer } = order;
	const date = formatEventDate(popup.eventDate);
	const who = customer.name ? `${customer.name} (${customer.email})` : customer.email;
	const pieces = order.items.reduce((n, i) => n + i.quantity, 0);

	const html = layout({
		preheader: `${who} ordered ${pieces} bikini${pieces === 1 ? '' : 's'} for ${popup.eventName}.`,
		body: `${heading('New order')}
<p style="margin:0;">${pieces} bikini${pieces === 1 ? '' : 's'} for collection at ${esc(popup.eventName)}.</p>
${referenceBox(order.reference)}
${eyebrow('Customer')}
<div>${customer.name ? `${esc(customer.name)}<br>` : ''}<a href="mailto:${esc(customer.email)}" style="color:${theme.roseDark};">${esc(customer.email)}</a></div>
${eyebrow('Order')}
${itemsTable(order)}
${eyebrow('Collection')}
${popupBlock(order, { withButtons: false })}
<p style="margin:28px 0 0;font-size:13px;color:${theme.muted};">Reply to this email to contact the customer. Status is <strong style="color:${theme.ink};">placed</strong> — update it in the database as the order progresses.</p>`
	});

	const text = `New order ${order.reference}

Customer: ${who}

${itemsText(order)}

Total: ${formatPrice(order.total)}

Collection: ${popup.eventName}, ${date}
Map: ${popup.mapsUrl}${popup.eventUrl ? `\nEvent: ${popup.eventUrl}` : ''}

Reply to this email to contact the customer.`;

	return {
		subject: `New order ${order.reference} — ${customer.name ?? customer.email} — ${formatPrice(order.total)}`,
		html,
		text
	};
}
