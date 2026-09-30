CREATE TABLE `upload_outcomes` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`route` text NOT NULL,
	`status` integer NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_upload_outcomes_created` ON `upload_outcomes` (`created`);--> statement-breakpoint
ALTER TABLE `feedback` ADD `resolved_at` text;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `topic` text DEFAULT '' NOT NULL;