-- Business rules enforced inside the database, so they also apply to rows edited by hand.
-- Error codes raised here are mapped to friendly messages in src/lib/server/orders.ts.

-- ── Pop-ups ────────────────────────────────────────────────────────────────────────────────
-- New orders need an open pop-up that hasn't hit max_orders (cancelled orders don't count).
CREATE TRIGGER orders_check_popup
BEFORE INSERT ON orders
BEGIN
	SELECT RAISE(ABORT, 'popup_closed')
	WHERE NOT EXISTS (SELECT 1 FROM popups WHERE id = NEW.popup_id AND orders_open = 1);

	SELECT RAISE(ABORT, 'popup_full')
	FROM popups p
	WHERE p.id = NEW.popup_id
		AND p.max_orders IS NOT NULL
		AND (SELECT count(*) FROM orders WHERE popup_id = p.id AND status != 'cancelled') >= p.max_orders;
END;
--> statement-breakpoint

-- ── Status tracking ────────────────────────────────────────────────────────────────────────
CREATE TRIGGER orders_log_created
AFTER INSERT ON orders
BEGIN
	INSERT INTO order_status_history (order_id, from_status, to_status) VALUES (NEW.id, NULL, NEW.status);
END;
--> statement-breakpoint

CREATE TRIGGER orders_log_status_change
AFTER UPDATE OF status ON orders
WHEN OLD.status IS NOT NEW.status
BEGIN
	INSERT INTO order_status_history (order_id, from_status, to_status) VALUES (NEW.id, OLD.status, NEW.status);
	UPDATE orders SET status_updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
--> statement-breakpoint

-- Cancelled is final: its stock has been returned, so reviving it would oversell.
CREATE TRIGGER orders_block_uncancel
BEFORE UPDATE OF status ON orders
WHEN OLD.status = 'cancelled' AND NEW.status != 'cancelled'
BEGIN
	SELECT RAISE(ABORT, 'order_cancelled');
END;
--> statement-breakpoint

-- Only cancelled orders can be deleted (e.g. clearing out test data); cancel first so stock is returned.
CREATE TRIGGER orders_block_delete_active
BEFORE DELETE ON orders
WHEN OLD.status != 'cancelled'
BEGIN
	SELECT RAISE(ABORT, 'cancel_before_delete');
END;
--> statement-breakpoint

-- ── Stock ──────────────────────────────────────────────────────────────────────────────────
CREATE TRIGGER stock_touch_updated_at
AFTER UPDATE OF quantity ON stock
BEGIN
	UPDATE stock SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
--> statement-breakpoint

-- A missing stock row counts as zero.
CREATE TRIGGER order_items_check_stock
BEFORE INSERT ON order_items
BEGIN
	SELECT RAISE(ABORT, 'order_cancelled')
	WHERE (SELECT status FROM orders WHERE id = NEW.order_id) = 'cancelled';

	SELECT RAISE(ABORT, 'out_of_stock')
	WHERE coalesce((SELECT quantity FROM stock
		WHERE colour_id = NEW.top_colour_id AND piece = 'top' AND size = NEW.top_size), 0) < NEW.quantity;

	SELECT RAISE(ABORT, 'out_of_stock')
	WHERE coalesce((SELECT quantity FROM stock
		WHERE colour_id = NEW.bottom_colour_id AND piece = 'bottom' AND size = NEW.bottom_size), 0) < NEW.quantity;
END;
--> statement-breakpoint

CREATE TRIGGER order_items_take_stock
AFTER INSERT ON order_items
BEGIN
	UPDATE stock SET quantity = quantity - NEW.quantity
	WHERE colour_id = NEW.top_colour_id AND piece = 'top' AND size = NEW.top_size;

	UPDATE stock SET quantity = quantity - NEW.quantity
	WHERE colour_id = NEW.bottom_colour_id AND piece = 'bottom' AND size = NEW.bottom_size;
END;
--> statement-breakpoint

-- Editing an item by hand (e.g. fixing a size): return the old pieces, take the new ones.
-- If the new pieces aren't in stock the CHECK (quantity >= 0) on stock aborts the edit.
CREATE TRIGGER order_items_check_edit
BEFORE UPDATE OF top_colour_id, top_size, bottom_colour_id, bottom_size, quantity ON order_items
BEGIN
	SELECT RAISE(ABORT, 'order_cancelled')
	WHERE (SELECT status FROM orders WHERE id = NEW.order_id) = 'cancelled';

	SELECT RAISE(ABORT, 'out_of_stock')
	WHERE NOT EXISTS (SELECT 1 FROM stock
		WHERE colour_id = NEW.top_colour_id AND piece = 'top' AND size = NEW.top_size);

	SELECT RAISE(ABORT, 'out_of_stock')
	WHERE NOT EXISTS (SELECT 1 FROM stock
		WHERE colour_id = NEW.bottom_colour_id AND piece = 'bottom' AND size = NEW.bottom_size);
END;
--> statement-breakpoint

CREATE TRIGGER order_items_swap_stock
AFTER UPDATE OF top_colour_id, top_size, bottom_colour_id, bottom_size, quantity ON order_items
BEGIN
	UPDATE stock SET quantity = quantity + OLD.quantity
	WHERE colour_id = OLD.top_colour_id AND piece = 'top' AND size = OLD.top_size;

	UPDATE stock SET quantity = quantity + OLD.quantity
	WHERE colour_id = OLD.bottom_colour_id AND piece = 'bottom' AND size = OLD.bottom_size;

	UPDATE stock SET quantity = quantity - NEW.quantity
	WHERE colour_id = NEW.top_colour_id AND piece = 'top' AND size = NEW.top_size;

	UPDATE stock SET quantity = quantity - NEW.quantity
	WHERE colour_id = NEW.bottom_colour_id AND piece = 'bottom' AND size = NEW.bottom_size;
END;
--> statement-breakpoint

-- Removing an item from a live order returns its pieces. (Items of cancelled or deleted
-- orders were already returned on cancel, so they're skipped.)
CREATE TRIGGER order_items_return_stock_on_delete
AFTER DELETE ON order_items
WHEN (SELECT status FROM orders WHERE id = OLD.order_id) NOT IN ('cancelled')
BEGIN
	UPDATE stock SET quantity = quantity + OLD.quantity
	WHERE colour_id = OLD.top_colour_id AND piece = 'top' AND size = OLD.top_size;

	UPDATE stock SET quantity = quantity + OLD.quantity
	WHERE colour_id = OLD.bottom_colour_id AND piece = 'bottom' AND size = OLD.bottom_size;
END;
--> statement-breakpoint

-- Cancelling an order returns all of its pieces to stock.
CREATE TRIGGER orders_return_stock_on_cancel
AFTER UPDATE OF status ON orders
WHEN NEW.status = 'cancelled' AND OLD.status != 'cancelled'
BEGIN
	UPDATE stock
	SET quantity = quantity + (
		SELECT coalesce(sum(oi.quantity), 0) FROM order_items oi
		WHERE oi.order_id = NEW.id AND oi.top_colour_id = stock.colour_id AND oi.top_size = stock.size
	)
	WHERE piece = 'top' AND EXISTS (
		SELECT 1 FROM order_items oi
		WHERE oi.order_id = NEW.id AND oi.top_colour_id = stock.colour_id AND oi.top_size = stock.size
	);

	UPDATE stock
	SET quantity = quantity + (
		SELECT coalesce(sum(oi.quantity), 0) FROM order_items oi
		WHERE oi.order_id = NEW.id AND oi.bottom_colour_id = stock.colour_id AND oi.bottom_size = stock.size
	)
	WHERE piece = 'bottom' AND EXISTS (
		SELECT 1 FROM order_items oi
		WHERE oi.order_id = NEW.id AND oi.bottom_colour_id = stock.colour_id AND oi.bottom_size = stock.size
	);
END;
