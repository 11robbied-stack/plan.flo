CREATE TABLE `project_members` (
	`owner` text NOT NULL,
	`project_id` text NOT NULL,
	`member_id` text NOT NULL,
	PRIMARY KEY(`owner`, `project_id`, `member_id`),
	FOREIGN KEY (`project_id`,`owner`) REFERENCES `projects`(`id`,`owner`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`,`owner`) REFERENCES `company_members`(`id`,`owner`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_project_members_member` ON `project_members` (`member_id`,`owner`);--> statement-breakpoint
ALTER TABLE `company_members` ADD `project_access_version` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_company_members_id_owner` ON `company_members` (`id`,`owner`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_projects_id_owner` ON `projects` (`id`,`owner`);
--> statement-breakpoint
-- Serialize invite acceptance against concurrent creation of a personal workspace.
CREATE TRIGGER protect_owned_workspace_join BEFORE UPDATE OF user_id ON company_members WHEN NEW.user_id IS NOT NULL AND OLD.user_id IS NULL AND (EXISTS(SELECT 1 FROM settings WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM projects WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM records WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM files WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM file_folders WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM company_members WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM builders WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM safety_docs WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM om_manuals WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM schedule_entries WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM subscriptions WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM billing_accounts WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM app_settings WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM payroll_config WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM payroll_reviews WHERE owner=NEW.user_id)) BEGIN SELECT RAISE(ABORT,'PLANFLO_OWNER_HAS_WORKSPACE'); END;
--> statement-breakpoint
CREATE TRIGGER prevent_member_personal_settings BEFORE INSERT ON settings WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;
--> statement-breakpoint
CREATE TRIGGER prevent_member_personal_projects BEFORE INSERT ON projects WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;
--> statement-breakpoint
CREATE TRIGGER prevent_member_personal_records BEFORE INSERT ON records WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;
--> statement-breakpoint
CREATE TRIGGER prevent_member_personal_files BEFORE INSERT ON files WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;
--> statement-breakpoint
CREATE TRIGGER prevent_member_personal_file_folders BEFORE INSERT ON file_folders WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;
--> statement-breakpoint
CREATE TRIGGER prevent_member_personal_company_members BEFORE INSERT ON company_members WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;
--> statement-breakpoint
CREATE TRIGGER prevent_member_personal_builders BEFORE INSERT ON builders WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;
--> statement-breakpoint
CREATE TRIGGER prevent_member_personal_safety_docs BEFORE INSERT ON safety_docs WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;
--> statement-breakpoint
CREATE TRIGGER prevent_member_personal_om_manuals BEFORE INSERT ON om_manuals WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;
--> statement-breakpoint
CREATE TRIGGER prevent_member_personal_schedule_entries BEFORE INSERT ON schedule_entries WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;
--> statement-breakpoint
CREATE TRIGGER prevent_member_personal_subscriptions BEFORE INSERT ON subscriptions WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;
--> statement-breakpoint
CREATE TRIGGER prevent_member_personal_billing_accounts BEFORE INSERT ON billing_accounts WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;
--> statement-breakpoint
CREATE TRIGGER prevent_member_personal_app_settings BEFORE INSERT ON app_settings WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;
--> statement-breakpoint
CREATE TRIGGER prevent_member_personal_payroll_config BEFORE INSERT ON payroll_config WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;
--> statement-breakpoint
CREATE TRIGGER prevent_member_personal_payroll_reviews BEFORE INSERT ON payroll_reviews WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;
