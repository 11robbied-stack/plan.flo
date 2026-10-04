CREATE TABLE `dashboard_layouts` (
	`owner` text NOT NULL,
	`user_id` text NOT NULL,
	`data` text DEFAULT '{}' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_dashboard_layout_user_company` ON `dashboard_layouts` (`owner`,`user_id`);