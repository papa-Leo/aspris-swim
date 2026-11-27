import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema.ts';

export const getDb = (d1: D1Database) => drizzle(d1, { schema });

/**
 * The database for the current environment. Use this in loads, form actions and endpoints.
 *
 * Every Wrangler environment binds its own database as `DB` (see wrangler.jsonc):
 * - `npm run dev` → the local copy of staging in `.wrangler/state` (the db:*:local scripts)
 * - `wrangler deploy --env staging` → aspris-staging
 * - `wrangler deploy` → aspris-prod
 */
export const db = () => getDb(env.DB);
