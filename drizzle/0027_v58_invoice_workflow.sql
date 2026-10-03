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
--> statement-breakpoint
-- New invoice references must stay within their owning company; empty project means admin inbox.
CREATE TRIGGER invoice_project_insert BEFORE INSERT ON supplier_invoices WHEN NEW.project_id<>'' AND NOT EXISTS(SELECT 1 FROM projects WHERE id=NEW.project_id AND owner=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_INVOICE_PROJECT'); END;
--> statement-breakpoint
CREATE TRIGGER invoice_project_update BEFORE UPDATE OF project_id,owner ON supplier_invoices WHEN NEW.owner<>OLD.owner OR (NEW.project_id<>'' AND NOT EXISTS(SELECT 1 FROM projects WHERE id=NEW.project_id AND owner=NEW.owner)) BEGIN SELECT RAISE(ABORT,'PLANFLO_INVOICE_PROJECT'); END;
--> statement-breakpoint
CREATE TRIGGER invoice_file_insert BEFORE INSERT ON supplier_invoices WHEN NEW.file_id<>'' AND NOT EXISTS(SELECT 1 FROM files WHERE id=NEW.file_id AND owner=NEW.owner AND category='invoice') BEGIN SELECT RAISE(ABORT,'PLANFLO_INVOICE_FILE'); END;
--> statement-breakpoint
CREATE TRIGGER invoice_file_update BEFORE UPDATE OF file_id,owner ON supplier_invoices WHEN NEW.file_id<>'' AND NOT EXISTS(SELECT 1 FROM files WHERE id=NEW.file_id AND owner=NEW.owner AND category='invoice') BEGIN SELECT RAISE(ABORT,'PLANFLO_INVOICE_FILE'); END;
--> statement-breakpoint
CREATE TRIGGER prevent_member_personal_invoices BEFORE INSERT ON supplier_invoices WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;
