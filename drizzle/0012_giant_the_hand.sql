CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`sender_id` text NOT NULL,
	`sender_name` text NOT NULL,
	`sender_email` text NOT NULL,
	`type` text NOT NULL,
	`impact` text DEFAULT '' NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`project_id` text DEFAULT '' NOT NULL,
	`project_name` text DEFAULT '' NOT NULL,
	`section` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'New' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_feedback_owner_created` ON `feedback` (`owner`,`created`);