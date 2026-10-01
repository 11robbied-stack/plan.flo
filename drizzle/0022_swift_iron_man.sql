CREATE TABLE `staff_demos` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`title` text NOT NULL,
	`start` text NOT NULL,
	`end` text NOT NULL,
	`status` text DEFAULT 'Planned' NOT NULL,
	`assignee` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_staff_demos_start` ON `staff_demos` (`start`);--> statement-breakpoint
CREATE TABLE `staff_integration_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`support_email` text DEFAULT '' NOT NULL,
	`info_email` text DEFAULT '' NOT NULL,
	`booking_url` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `staff_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`stage` text DEFAULT 'New' NOT NULL,
	`assignee` text DEFAULT '' NOT NULL,
	`follow_up` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`source` text DEFAULT 'Manual' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_staff_leads_stage` ON `staff_leads` (`stage`);--> statement-breakpoint
CREATE TABLE `staff_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`details` text DEFAULT '' NOT NULL,
	`category` text NOT NULL,
	`status` text DEFAULT 'Review' NOT NULL,
	`priority` text DEFAULT 'Normal' NOT NULL,
	`assignee` text DEFAULT '' NOT NULL,
	`due` text DEFAULT '' NOT NULL,
	`company_owner` text DEFAULT '' NOT NULL,
	`source_type` text DEFAULT 'manual' NOT NULL,
	`source_id` text DEFAULT '' NOT NULL,
	`source_key` text NOT NULL,
	`fingerprint` text DEFAULT '' NOT NULL,
	`source_state` text DEFAULT '' NOT NULL,
	`outcome` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_staff_tasks_source` ON `staff_tasks` (`source_key`);--> statement-breakpoint
CREATE INDEX `idx_staff_tasks_category_status` ON `staff_tasks` (`category`,`status`);