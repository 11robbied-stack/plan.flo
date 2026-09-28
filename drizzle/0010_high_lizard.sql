CREATE TABLE `builders` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`colour` text NOT NULL,
	`status` text DEFAULT 'Active' NOT NULL,
	`data` text DEFAULT '{}' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_builders_owner_name` ON `builders` (`owner`,`name_key`);--> statement-breakpoint
ALTER TABLE `projects` ADD `builder_id` text DEFAULT '' NOT NULL;
--> statement-breakpoint
UPDATE settings SET colour='#6250e8' WHERE lower(colour)='#1769f4';
