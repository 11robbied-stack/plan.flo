CREATE TABLE `platform_accounts` (
	`owner` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'Active' NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `platform_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`owner` text DEFAULT '' NOT NULL,
	`detail` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_platform_audit_date` ON `platform_audit` (`created`);--> statement-breakpoint
CREATE INDEX `idx_platform_audit_owner` ON `platform_audit` (`owner`);--> statement-breakpoint
CREATE TABLE `platform_usage` (
	`owner` text NOT NULL,
	`user_id` text NOT NULL,
	`day` text NOT NULL,
	`section` text NOT NULL,
	`views` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_platform_usage_key` ON `platform_usage` (`owner`,`user_id`,`day`,`section`);--> statement-breakpoint
CREATE INDEX `idx_platform_usage_day` ON `platform_usage` (`day`);--> statement-breakpoint
CREATE TABLE `platform_users` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`status` text DEFAULT 'Active' NOT NULL,
	`first_seen` text NOT NULL,
	`last_seen` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_platform_users_owner` ON `platform_users` (`owner`);--> statement-breakpoint
CREATE INDEX `idx_platform_users_seen` ON `platform_users` (`last_seen`);--> statement-breakpoint
CREATE TABLE `support_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`feedback_id` text NOT NULL,
	`author` text NOT NULL,
	`body` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_support_notes_feedback` ON `support_notes` (`feedback_id`,`created`);--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`feedback_id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`priority` text NOT NULL,
	`assignee` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated` text NOT NULL
);
