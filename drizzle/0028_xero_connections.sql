CREATE TABLE `xero_connections` (
	`owner` text PRIMARY KEY NOT NULL,
	`tokens` text DEFAULT '' NOT NULL,
	`tenant_id` text,
	`tenant_name` text DEFAULT '' NOT NULL,
	`connection_id` text DEFAULT '' NOT NULL,
	`choices` text DEFAULT '[]' NOT NULL,
	`catalog` text DEFAULT '{}' NOT NULL,
	`mapping` text DEFAULT '{}' NOT NULL,
	`attempt_id` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`lock_until` integer DEFAULT 0 NOT NULL,
	`updated` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_xero_tenant` ON `xero_connections` (`tenant_id`);--> statement-breakpoint
CREATE TABLE `xero_oauth_states` (
	`state_hash` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`user_id` text NOT NULL,
	`verifier` text NOT NULL,
	`expires` integer NOT NULL
);
