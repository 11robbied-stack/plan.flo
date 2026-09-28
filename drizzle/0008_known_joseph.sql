CREATE TABLE `om_manuals` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`project_id` text NOT NULL,
	`status` text DEFAULT 'Draft' NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_om_owner_project` ON `om_manuals` (`owner`,`project_id`);