import { EMAIL_FROM, OWNER_EMAIL, RESEND_API_KEY } from '$app/env/private';
import type { OrderSummary } from '../orders.ts';
import { customerConfirmation, ownerNotification } from './templates.ts';

type Message = {
	to: string;
	subject: string;
	html: string;
	text: string;
	replyTo?: string;
	/** Resend ignores repeat sends with the same key for 24h, so a retry can't double-email. */
	idempotencyKey: string;
};

async function send(message: Message) {
	if (!RESEND_API_KEY || !EMAIL_FROM) {
		console.info(
			`[email] RESEND_API_KEY / EMAIL_FROM not set — not sending.\n` +
				`To: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n`
		);
		return;
	}

	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${RESEND_API_KEY}`,
			'Content-Type': 'application/json',
			'Idempotency-Key': message.idempotencyKey
		},
		body: JSON.stringify({
			from: EMAIL_FROM,
			to: [message.to],
			subject: message.subject,
			html: message.html,
			text: message.text,
			reply_to: message.replyTo
		})
	});
	if (!response.ok) {
		throw new Error(`Resend responded ${response.status}: ${await response.text()}`);
	}
}

/**
 * Sends the customer's confirmation and the owner's new-order notification.
 * Never throws: the order is already placed, so a failed email is logged rather than
 * failing checkout. Returns whether the customer's confirmation went out.
 */
export async function sendOrderEmails(order: OrderSummary) {
	const customer = customerConfirmation(order);
	const owner = ownerNotification(order);

	const [customerResult, ownerResult] = await Promise.allSettled([
		send({
			to: order.customer.email,
			...customer,
			replyTo: OWNER_EMAIL,
			idempotencyKey: `order-${order.reference}-customer`
		}),
		OWNER_EMAIL
			? send({
					to: OWNER_EMAIL,
					...owner,
					replyTo: order.customer.email,
					idempotencyKey: `order-${order.reference}-owner`
				})
			: Promise.resolve(
					console.warn(`[email] OWNER_EMAIL not set — no notification sent for ${order.reference}.`)
				)
	]);

	if (customerResult.status === 'rejected') {
		console.error(`[email] confirmation for ${order.reference} failed:`, customerResult.reason);
	}
	if (ownerResult.status === 'rejected') {
		console.error(`[email] owner notification for ${order.reference} failed:`, ownerResult.reason);
	}
	return { customerSent: customerResult.status === 'fulfilled' };
}
