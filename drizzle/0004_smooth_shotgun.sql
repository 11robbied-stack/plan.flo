CREATE TABLE `file_folders` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`project_id` text NOT NULL,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_file_folders_project_category_name` ON `file_folders` (`project_id`,`category`,`name_key`);--> statement-breakpoint
ALTER TABLE `files` ADD `folder_id` text DEFAULT '' NOT NULL;