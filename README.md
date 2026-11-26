# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@1.7.1 create --template minimal --types ts --add prettier eslint tailwindcss="plugins:typography,forms" sveltekit-adapter="adapter:cloudflare+cfTarget:workers" drizzle="database:d1" --install npm ./
```

## Adding features

Add features to your project with `sv add`:

```sh
npx sv add
```

For example, to add Tailwind CSS:

```sh
npx sv add tailwindcss
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

## Local database

`npm run dev` uses a local copy of the `aspris-staging` D1 database (stored in `.wrangler/state`). Set it up once:

```sh
npm run db:migrate:local   # create tables + triggers (re-run after adding migrations)
npm run db:seed:local      # starter styles, colours, sizes + a stock row for each (all 0)
npm run db:studio:local    # browse/edit it at https://local.drizzle.studio
```

### Using the database in a feature

Server code gets the database from `db()` in `src/lib/server/db/index.ts`. In dev it's the local
database; when deployed it's `aspris_prod`. Keep queries in a helper under `src/lib/server/` and call
it from a `+page.server.ts` load or form action:

```ts
// src/routes/example/+page.server.ts
import { db } from '#lib/server/db/index.ts';
import { getUpcomingPopups } from '#lib/server/orders.ts';

export const load = async () => ({ popups: await getUpcomingPopups(db()) });
```

`src/routes/custom/+page.server.ts` is a working example: it loads the catalogue (styles, prices,
colours, sizes and stock) with `getCatalogue()` so the builder shows what's in the database and greys
out sold-out options.

All clothing data (styles and prices, colours, sizes, stock) lives only in the database. Change it
there, e.g. with `npm run db:studio:local`, rather than in code.

## Order emails (Resend)

Checkout sends the customer a confirmation and the shop owner a new-order notification via
[Resend](https://resend.com). Templates are in `src/lib/server/email/templates.ts`.

| Variable         | What it is                                                                       |
| ---------------- | -------------------------------------------------------------------------------- |
| `RESEND_API_KEY` | API key from Resend. Leave blank locally to print emails to the console instead. |
| `EMAIL_FROM`     | Sender, on a domain verified in Resend, e.g. `Aspris Swim <orders@example.com>`. |
| `OWNER_EMAIL`    | Receives new-order notifications; customers' replies go here too.                |

- **Local:** add them to `.env` (see `.env.example`), then restart `npm run dev`.
- **Deployed:** `npx wrangler secret put RESEND_API_KEY` (and the same for the other two).

Emails are sent after the order is saved, so a failed email never loses an order; failures are
logged, and the customer is told to keep their order number.
