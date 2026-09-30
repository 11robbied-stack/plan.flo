CREATE TABLE `schedule_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`worker_key` text DEFAULT '' NOT NULL,
	`worker_name` text DEFAULT '' NOT NULL,
	`project_id` text DEFAULT '' NOT NULL,
	`project_name` text DEFAULT '' NOT NULL,
	`kind` text NOT NULL,
	`date` text NOT NULL,
	`start` text DEFAULT '' NOT NULL,
	`end` text DEFAULT '' NOT NULL,
	`break_minutes` integer DEFAULT 0 NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`leave_type` text DEFAULT '' NOT NULL,
	`role` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_schedule_owner_date` ON `schedule_entries` (`owner`,`date`);