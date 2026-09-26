CREATE TABLE `company_members` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`user_id` text,
	`role` text DEFAULT 'member' NOT NULL,
	`permissions` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`token_hash` text,
	`expires` text,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `company_members_user_id_unique` ON `company_members` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `company_members_token_hash_unique` ON `company_members` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_company_members_owner` ON `company_members` (`owner`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`owner` text PRIMARY KEY NOT NULL,
	`plan` text DEFAULT 'unconfigured' NOT NULL,
	`status` text DEFAULT 'Not activated' NOT NULL,
	`requested_plan` text,
	`requested_at` text
);
