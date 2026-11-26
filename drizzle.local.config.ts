import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Studio for the local D1 database that `wrangler` / `vite dev` use
 * (run `npm run db:migrate:local` first).
 *
 * Wrangler stores each local D1 database as a hashed .sqlite file. If you have more than one
 * (e.g. both prod and staging bindings have been used locally), the most recently modified is
 * picked; set LOCAL_D1_PATH to choose a specific file.
 */
const D1_DIR = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject';

function findLocalDb() {
	if (process.env.LOCAL_D1_PATH) return process.env.LOCAL_D1_PATH;

	let files: string[] = [];
	try {
		files = readdirSync(D1_DIR).filter((f) => f.endsWith('.sqlite') && f !== 'metadata.sqlite');
	} catch {
		// directory doesn't exist yet
	}
	if (!files.length) {
		throw new Error(
			`No local D1 database found in ${D1_DIR}. Run \`npm run db:migrate:local\` first.`
		);
	}
	return files
		.map((f) => join(D1_DIR, f))
		.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
}

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'sqlite',
	dbCredentials: { url: `file:${findLocalDb()}` },
	verbose: true,
	strict: true
});
