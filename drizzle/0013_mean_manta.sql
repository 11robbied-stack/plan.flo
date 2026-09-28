CREATE TABLE `billing_accounts` (
	`owner` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`checkout_lock` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `billing_accounts_customer_id_unique` ON `billing_accounts` (`customer_id`);