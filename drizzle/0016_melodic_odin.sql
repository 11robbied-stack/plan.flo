ALTER TABLE `company_members` ADD `seat_type` text DEFAULT 'office' NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `requested_configuration` text DEFAULT '{}' NOT NULL;