CREATE TABLE `gmail_connections` (
	`owner` text PRIMARY KEY NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`refresh_token` text DEFAULT '' NOT NULL,
	`enabled` integer DEFAULT 0 NOT NULL,
	`last_sync` text DEFAULT '' NOT NULL,
	`last_error` text DEFAULT '' NOT NULL,
	`cursor` text DEFAULT '' NOT NULL,
	`scan_after` text DEFAULT '' NOT NULL,
	`scan_before` text DEFAULT '' NOT NULL,
	`lock_until` integer DEFAULT 0 NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `gmail_oauth_states` (
	`state_hash` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`user_id` text NOT NULL,
	`verifier` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `supplier_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`source_key` text NOT NULL,
	`mailbox` text NOT NULL,
	`message_id` text NOT NULL,
	`project_id` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Needs review' NOT NULL,
	`match_reason` text DEFAULT '' NOT NULL,
	`data` text NOT NULL,
	`file_id` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`reviewed_by` text DEFAULT '' NOT NULL,
	`reviewed_at` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_supplier_invoice_source` ON `supplier_invoices` (`owner`,`source_key`);--> statement-breakpoint
CREATE INDEX `idx_supplier_invoice_project` ON `supplier_invoices` (`owner`,`project_id`,`status`);--> statement-breakpoint
ALTER TABLE `projects` ADD `purchase_order_number` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_projects_owner_po` ON `projects` (`owner`,`purchase_order_number`) WHERE purchase_order_number <> '';