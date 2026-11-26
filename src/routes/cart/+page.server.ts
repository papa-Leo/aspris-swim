import { db } from '#lib/server/db/index.ts';
import { getCatalogue } from '#lib/server/catalogue.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ catalogue: await getCatalogue(db()) });
