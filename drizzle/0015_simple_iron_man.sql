CREATE TABLE `payroll_config` (
	`owner` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payroll_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`start` text NOT NULL,
	`end` text NOT NULL,
	`fingerprint` text NOT NULL,
	`data` text NOT NULL,
	`state` text DEFAULT 'Approved' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`sync_status` text DEFAULT 'Not sent' NOT NULL,
	`external_ids` text DEFAULT '{}' NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_payroll_review_period` ON `payroll_reviews` (`owner`,`start`,`end`);