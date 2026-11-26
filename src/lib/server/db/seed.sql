-- Starter catalogue. Not a migration: run it once against a database after migrating, e.g.
--   npm run db:seed:local
--   npx wrangler d1 execute aspris-staging --remote --file src/lib/server/db/seed.sql
--
-- After this, the database is the only source of styles, prices, colours, sizes and stock;
-- edit them there (e.g. `npm run db:studio:local`), not in code. Re-running this file never
-- overwrites existing rows.

-- TODO: confirm real styles and prices. Prices are in cents (7500 = R75.00).
INSERT INTO styles (id, name, price, sort_order) VALUES
	('triangle', 'Triangle', 7500, 1),
	('bandeau', 'Bandeau', 7500, 2),
	('scoop', 'Scoop', 7500, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO colours (id, name, hex, sort_order) VALUES
	('red', 'Red', '#a3282f', 1),
	('white', 'White', '#f7f4ee', 2),
	('black', 'Black', '#1a1a1a', 3),
	('navy', 'Navy', '#172a4b', 4),
	('brown', 'Brown', '#7a523b', 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO sizes (id, sort_order) VALUES
	('XS', 1),
	('S', 2),
	('M', 3)
ON CONFLICT (id) DO NOTHING;

-- One stock row per colour × piece × size, all starting at 0. Set real numbers with e.g.
--   UPDATE stock SET quantity = 6 WHERE colour_id = 'navy' AND piece = 'top' AND size = 'S';
-- When you add a colour or size later, re-run this file to create its stock rows.
INSERT INTO stock (colour_id, piece, size, quantity)
SELECT c.id, p.piece, s.id, 0
FROM colours c
CROSS JOIN (SELECT 'top' AS piece UNION ALL SELECT 'bottom') p
CROSS JOIN sizes s
WHERE true
ON CONFLICT (colour_id, piece, size) DO NOTHING;
