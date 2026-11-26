CREATE TABLE `colours` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`hex` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	CONSTRAINT "colours_hex_format" CHECK(length("colours"."hex") = 7 AND substr("colours"."hex", 1, 1) = '#' AND substr("colours"."hex", 2) NOT GLOB '*[^0-9a-fA-F]*')
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	CONSTRAINT "customers_email_lowercase" CHECK("customers"."email" = lower("customers"."email"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_email_unique` ON `customers` (`email`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`style_id` text NOT NULL,
	`top_colour_id` text NOT NULL,
	`top_size` text NOT NULL,
	`bottom_colour_id` text NOT NULL,
	`bottom_size` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price` integer NOT NULL,
	`notes` text,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`style_id`) REFERENCES `styles`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`top_colour_id`) REFERENCES `colours`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`top_size`) REFERENCES `sizes`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`bottom_colour_id`) REFERENCES `colours`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`bottom_size`) REFERENCES `sizes`(`id`) ON UPDATE cascade ON DELETE no action,
	CONSTRAINT "order_items_quantity_positive" CHECK("order_items"."quantity" > 0)
);
--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE `order_status_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`from_status` text,
	`to_status` text NOT NULL,
	`changed_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `order_status_history_order_idx` ON `order_status_history` (`order_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reference` text NOT NULL,
	`customer_id` integer NOT NULL,
	`popup_id` integer NOT NULL,
	`status` text DEFAULT 'placed' NOT NULL,
	`total` integer NOT NULL,
	`currency` text NOT NULL,
	`admin_notes` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`status_updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`popup_id`) REFERENCES `popups`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "orders_status_valid" CHECK("orders"."status" IN ('placed', 'confirmed', 'in_production', 'ready', 'collected', 'cancelled')),
	CONSTRAINT "orders_total_non_negative" CHECK("orders"."total" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_reference_unique` ON `orders` (`reference`);--> statement-breakpoint
CREATE INDEX `orders_customer_idx` ON `orders` (`customer_id`);--> statement-breakpoint
CREATE INDEX `orders_popup_status_idx` ON `orders` (`popup_id`,`status`);--> statement-breakpoint
CREATE TABLE `popups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_name` text NOT NULL,
	`event_date` text NOT NULL,
	`maps_url` text NOT NULL,
	`event_url` text,
	`max_orders` integer,
	`orders_open` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	CONSTRAINT "popups_event_date_format" CHECK(date("popups"."event_date") IS "popups"."event_date"),
	CONSTRAINT "popups_max_orders_positive" CHECK("popups"."max_orders" IS NULL OR "popups"."max_orders" >= 0)
);
--> statement-breakpoint
CREATE INDEX `popups_event_date_idx` ON `popups` (`event_date`);--> statement-breakpoint
CREATE TABLE `sizes` (
	`id` text PRIMARY KEY NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stock` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`colour_id` text NOT NULL,
	`piece` text NOT NULL,
	`size` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`colour_id`) REFERENCES `colours`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`size`) REFERENCES `sizes`(`id`) ON UPDATE cascade ON DELETE no action,
	CONSTRAINT "stock_quantity_non_negative" CHECK("stock"."quantity" >= 0),
	CONSTRAINT "stock_piece_valid" CHECK("stock"."piece" IN ('top', 'bottom'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stock_colour_piece_size_idx` ON `stock` (`colour_id`,`piece`,`size`);--> statement-breakpoint
CREATE TABLE `styles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`price` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	CONSTRAINT "styles_price_non_negative" CHECK("styles"."price" >= 0)
);
