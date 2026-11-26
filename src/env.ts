import { defineEnvVars } from '@sveltejs/kit/env';

/** Treat unset or blank as "not configured". */
const optional = (value: string | undefined) => value?.trim() || undefined;

/**
 * Environment variables, read via `$app/env/private` (server-only).
 *
 * - Local dev: put them in `.env` (git-ignored; see `.env.example`).
 * - Deployed: `npx wrangler secret put RESEND_API_KEY` (and the same for the others).
 *
 * If RESEND_API_KEY isn't set, order emails are printed to the server console instead of sent,
 * so checkout can be tested locally without a Resend account.
 */
export const variables = defineEnvVars({
	RESEND_API_KEY: {
		description: 'Resend API key (https://resend.com/api-keys).',
		schema: optional
	},
	EMAIL_FROM: {
		description:
			'Sender for order emails, on a domain verified in Resend, e.g. "Aspris Swim <orders@asprisswim.co.za>".',
		schema: optional
	},
	OWNER_EMAIL: {
		description:
			'Where new-order notifications are sent (the shop owner). Also the reply-to for customers.',
		schema: optional
	}
});
