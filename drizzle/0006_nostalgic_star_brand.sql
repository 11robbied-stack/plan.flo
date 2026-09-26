CREATE TABLE `plan_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`file_id` text NOT NULL,
	`number` integer NOT NULL,
	`label` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_plan_revision_number` ON `plan_revisions` (`file_id`,`number`);--> statement-breakpoint
ALTER TABLE `files` ADD `current_revision_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `files` ADD `revision_number` integer DEFAULT 1 NOT NULL;