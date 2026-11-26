import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import { dev } from '$app/env';
import * as schema from './schema.ts';

export const getDb = (d1: D1Database) => drizzle(d1, { schema });

/**
 * The database for the current environment. Use this in loads, form actions and endpoints.
 *
 * - `npm run dev` → `aspris_staging`, served from the local `.wrangler/state` database that the
 *   `db:migrate:local`, `db:seed:local` and `db:studio:local` scripts manage.
 * - Deployed → `aspris_prod`.
 */
export const db = () => getDb(dev ? env.aspris_staging : env.aspris_prod);
