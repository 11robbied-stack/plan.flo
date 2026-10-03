CREATE TABLE IF NOT EXISTS `account_limits` (
	`owner` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT 0 NOT NULL,
	`plan` text DEFAULT '' NOT NULL,
	`projects` integer NOT NULL,
	`office` integer NOT NULL,
	`field` integer NOT NULL,
	`bytes` integer NOT NULL,
	`override_projects` integer,
	`override_office` integer,
	`override_field` integer,
	`override_bytes` integer,
	`expires` text,
	`reason` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS `app_settings` (
	`owner` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `auth_account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `auth_rate_limit` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`count` integer NOT NULL,
	`last_request` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `auth_session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `auth_user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
, `first_name` text DEFAULT '' NOT NULL, `surname` text DEFAULT '' NOT NULL, `business_name` text DEFAULT '' NOT NULL, `abn` text DEFAULT '' NOT NULL, `address` text DEFAULT '' NOT NULL, `phone` text DEFAULT '' NOT NULL, `rec` text DEFAULT '' NOT NULL);

CREATE TABLE IF NOT EXISTS `auth_verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `billing_accounts` (
	`owner` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`checkout_lock` integer
);

CREATE TABLE IF NOT EXISTS `builders` (
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

CREATE TABLE IF NOT EXISTS `company_members` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`user_id` text,
	`role` text DEFAULT 'member' NOT NULL,
	`permissions` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`token_hash` text,
	`expires` text,
	`created` text NOT NULL
, `seat_type` text DEFAULT 'office' NOT NULL, `project_access_version` integer DEFAULT 0 NOT NULL);

CREATE TABLE IF NOT EXISTS `customer_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`recipient` text DEFAULT '' NOT NULL,
	`ticket_id` text DEFAULT '' NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`author` text NOT NULL,
	`created` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `deletion_requests` (
	`owner` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`reason` text NOT NULL,
	`requested` text NOT NULL,
	`eligible` text NOT NULL,
	`actor` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS `feedback` (
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
, `resolved_at` text);

CREATE TABLE IF NOT EXISTS `file_folders` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`project_id` text NOT NULL,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`created` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `files` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`project_id` text NOT NULL,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`created` text NOT NULL
, `folder_id` text DEFAULT '' NOT NULL, `archived` integer DEFAULT false NOT NULL, `current_revision_id` text DEFAULT '' NOT NULL, `revision_number` integer DEFAULT 1 NOT NULL);

CREATE TABLE IF NOT EXISTS `message_reads` (
	`message_id` text NOT NULL,
	`user_id` text NOT NULL,
	`read` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `om_manuals` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`project_id` text NOT NULL,
	`status` text DEFAULT 'Draft' NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `payroll_config` (
	`owner` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `payroll_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`start` text NOT NULL,
	`end` text NOT NULL,
	`fingerprint` text NOT NULL,
	`data` text NOT NULL,
	`state` text DEFAULT 'Approved' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`sync_status` text DEFAULT 'Not sent' NOT NULL,
	`external_ids` text DEFAULT '{}' NOT NULL,
	`updated` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `plan_revisions` (
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

CREATE TABLE IF NOT EXISTS `platform_accounts` (
	`owner` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'Active' NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `platform_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`owner` text DEFAULT '' NOT NULL,
	`detail` text NOT NULL,
	`created` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `platform_operators` (
	`email` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `platform_usage` (
	`owner` text NOT NULL,
	`user_id` text NOT NULL,
	`day` text NOT NULL,
	`section` text NOT NULL,
	`views` integer DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS `platform_users` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`status` text DEFAULT 'Active' NOT NULL,
	`first_seen` text NOT NULL,
	`last_seen` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS `project_members` (
	`owner` text NOT NULL,
	`project_id` text NOT NULL,
	`member_id` text NOT NULL,
	PRIMARY KEY(`owner`, `project_id`, `member_id`),
	FOREIGN KEY (`project_id`,`owner`) REFERENCES `projects`(`id`,`owner`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`,`owner`) REFERENCES `company_members`(`id`,`owner`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`client` text DEFAULT '' NOT NULL,
	`builder` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`number` text DEFAULT '' NOT NULL,
	`contract` real DEFAULT 0 NOT NULL,
	`budget_hours` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'Active' NOT NULL,
	`created` text NOT NULL
, `setup` text DEFAULT '{}' NOT NULL, `last_activity` text DEFAULT '' NOT NULL, `builder_id` text DEFAULT '' NOT NULL);

CREATE TABLE IF NOT EXISTS `records` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`project_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`status` text DEFAULT '' NOT NULL,
	`data` text DEFAULT '{}' NOT NULL,
	`created` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `review_activity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner` text NOT NULL,
	`project_id` text NOT NULL,
	`source_type` text NOT NULL,
	`source_id` text NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`operation` text NOT NULL,
	`before_data` text,
	`after_data` text,
	`occurred` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `review_config` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `review_decisions` (
	`event_id` integer PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`decision` text NOT NULL,
	`actor` text NOT NULL,
	`decided` text NOT NULL,
	`task_id` text
);

CREATE TABLE IF NOT EXISTS `safety_docs` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`project_id` text DEFAULT '' NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`status` text DEFAULT 'Draft' NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `schedule_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`worker_key` text DEFAULT '' NOT NULL,
	`worker_name` text DEFAULT '' NOT NULL,
	`project_id` text DEFAULT '' NOT NULL,
	`project_name` text DEFAULT '' NOT NULL,
	`kind` text NOT NULL,
	`date` text NOT NULL,
	`start` text DEFAULT '' NOT NULL,
	`end` text DEFAULT '' NOT NULL,
	`break_minutes` integer DEFAULT 0 NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`leave_type` text DEFAULT '' NOT NULL,
	`role` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `settings` (
	`owner` text PRIMARY KEY NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`colour` text DEFAULT '#1769f4' NOT NULL,
	`theme` text DEFAULT 'Light' NOT NULL
, `abn` text DEFAULT '' NOT NULL, `address` text DEFAULT '' NOT NULL, `email` text DEFAULT '' NOT NULL, `phone` text DEFAULT '' NOT NULL, `logo_file_id` text DEFAULT '' NOT NULL, `staff_colours` text DEFAULT '{}' NOT NULL, `rec` text DEFAULT '' NOT NULL);

CREATE TABLE IF NOT EXISTS `staff_demos` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`title` text NOT NULL,
	`start` text NOT NULL,
	`end` text NOT NULL,
	`status` text DEFAULT 'Planned' NOT NULL,
	`assignee` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `staff_integration_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`support_email` text DEFAULT '' NOT NULL,
	`info_email` text DEFAULT '' NOT NULL,
	`booking_url` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `staff_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`stage` text DEFAULT 'New' NOT NULL,
	`assignee` text DEFAULT '' NOT NULL,
	`follow_up` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`source` text DEFAULT 'Manual' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `staff_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`details` text DEFAULT '' NOT NULL,
	`category` text NOT NULL,
	`status` text DEFAULT 'Review' NOT NULL,
	`priority` text DEFAULT 'Normal' NOT NULL,
	`assignee` text DEFAULT '' NOT NULL,
	`due` text DEFAULT '' NOT NULL,
	`company_owner` text DEFAULT '' NOT NULL,
	`source_type` text DEFAULT 'manual' NOT NULL,
	`source_id` text DEFAULT '' NOT NULL,
	`source_key` text NOT NULL,
	`fingerprint` text DEFAULT '' NOT NULL,
	`source_state` text DEFAULT '' NOT NULL,
	`outcome` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `subscriptions` (
	`owner` text PRIMARY KEY NOT NULL,
	`plan` text DEFAULT 'unconfigured' NOT NULL,
	`status` text DEFAULT 'Not activated' NOT NULL,
	`requested_plan` text,
	`requested_at` text
, `requested_configuration` text DEFAULT '{}' NOT NULL);

CREATE TABLE IF NOT EXISTS `support_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`feedback_id` text NOT NULL,
	`author` text NOT NULL,
	`body` text NOT NULL,
	`created` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `support_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`owner` text NOT NULL,
	`user_id` text NOT NULL,
	`reason` text NOT NULL,
	`expires` text NOT NULL,
	`created` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `support_tickets` (
	`feedback_id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`priority` text NOT NULL,
	`assignee` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated` text NOT NULL
, `topic` text DEFAULT '' NOT NULL);

CREATE TABLE IF NOT EXISTS `upload_outcomes` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`route` text NOT NULL,
	`status` integer NOT NULL,
	`created` text NOT NULL
);

CREATE INDEX IF NOT EXISTS `auth_account_user` ON `auth_account` (`user_id`);

CREATE UNIQUE INDEX IF NOT EXISTS `auth_rate_limit_key_unique` ON `auth_rate_limit` (`key`);

CREATE UNIQUE INDEX IF NOT EXISTS `auth_session_token_unique` ON `auth_session` (`token`);

CREATE INDEX IF NOT EXISTS `auth_session_user` ON `auth_session` (`user_id`);

CREATE UNIQUE INDEX IF NOT EXISTS `auth_user_email_unique` ON `auth_user` (`email`);

CREATE INDEX IF NOT EXISTS `auth_verification_identifier` ON `auth_verification` (`identifier`);

CREATE UNIQUE INDEX IF NOT EXISTS `billing_accounts_customer_id_unique` ON `billing_accounts` (`customer_id`);

CREATE UNIQUE INDEX IF NOT EXISTS `company_members_token_hash_unique` ON `company_members` (`token_hash`);

CREATE UNIQUE INDEX IF NOT EXISTS `company_members_user_id_unique` ON `company_members` (`user_id`);

CREATE UNIQUE INDEX IF NOT EXISTS `idx_builders_owner_name` ON `builders` (`owner`,`name_key`);

CREATE UNIQUE INDEX IF NOT EXISTS `idx_company_members_id_owner` ON `company_members` (`id`,`owner`);

CREATE INDEX IF NOT EXISTS `idx_company_members_owner` ON `company_members` (`owner`);

CREATE INDEX IF NOT EXISTS `idx_customer_messages_owner` ON `customer_messages` (`owner`);

CREATE INDEX IF NOT EXISTS `idx_feedback_owner_created` ON `feedback` (`owner`,`created`);

CREATE UNIQUE INDEX IF NOT EXISTS `idx_file_folders_project_category_name` ON `file_folders` (`project_id`,`category`,`name_key`);

CREATE INDEX IF NOT EXISTS `idx_files_project_category` ON `files` (`project_id`,`category`);

CREATE UNIQUE INDEX IF NOT EXISTS `idx_message_read` ON `message_reads` (`message_id`,`user_id`);

CREATE INDEX IF NOT EXISTS `idx_om_owner_project` ON `om_manuals` (`owner`,`project_id`);

CREATE UNIQUE INDEX IF NOT EXISTS `idx_payroll_review_period` ON `payroll_reviews` (`owner`,`start`,`end`);

CREATE UNIQUE INDEX IF NOT EXISTS `idx_plan_revision_number` ON `plan_revisions` (`file_id`,`number`);

CREATE INDEX IF NOT EXISTS `idx_platform_audit_date` ON `platform_audit` (`created`);

CREATE INDEX IF NOT EXISTS `idx_platform_audit_owner` ON `platform_audit` (`owner`);

CREATE INDEX IF NOT EXISTS `idx_platform_usage_day` ON `platform_usage` (`day`);

CREATE UNIQUE INDEX IF NOT EXISTS `idx_platform_usage_key` ON `platform_usage` (`owner`,`user_id`,`day`,`section`);

CREATE INDEX IF NOT EXISTS `idx_platform_users_owner` ON `platform_users` (`owner`);

CREATE INDEX IF NOT EXISTS `idx_platform_users_seen` ON `platform_users` (`last_seen`);

CREATE INDEX IF NOT EXISTS `idx_project_members_member` ON `project_members` (`member_id`,`owner`);

CREATE UNIQUE INDEX IF NOT EXISTS `idx_projects_id_owner` ON `projects` (`id`,`owner`);

CREATE INDEX IF NOT EXISTS `idx_projects_owner` ON `projects` (`owner`);

CREATE INDEX IF NOT EXISTS `idx_records_project_kind` ON `records` (`project_id`,`kind`);

CREATE INDEX IF NOT EXISTS `idx_review_activity_owner_id` ON `review_activity` (`owner`,`id`);

CREATE INDEX IF NOT EXISTS `idx_review_activity_source` ON `review_activity` (`owner`,`source_type`,`source_id`,`id`);

CREATE INDEX IF NOT EXISTS `idx_review_decisions_owner` ON `review_decisions` (`owner`);

CREATE INDEX IF NOT EXISTS `idx_safety_owner_project` ON `safety_docs` (`owner`,`project_id`);

CREATE INDEX IF NOT EXISTS `idx_schedule_owner_date` ON `schedule_entries` (`owner`,`date`);

CREATE INDEX IF NOT EXISTS `idx_staff_demos_start` ON `staff_demos` (`start`);

CREATE INDEX IF NOT EXISTS `idx_staff_leads_stage` ON `staff_leads` (`stage`);

CREATE INDEX IF NOT EXISTS `idx_staff_tasks_category_status` ON `staff_tasks` (`category`,`status`);

CREATE UNIQUE INDEX IF NOT EXISTS `idx_staff_tasks_source` ON `staff_tasks` (`source_key`);

CREATE INDEX IF NOT EXISTS `idx_support_notes_feedback` ON `support_notes` (`feedback_id`,`created`);

CREATE INDEX IF NOT EXISTS `idx_upload_outcomes_created` ON `upload_outcomes` (`created`);

CREATE TRIGGER IF NOT EXISTS file_folders_activity_delete AFTER DELETE ON file_folders BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=OLD.project_id AND owner=OLD.owner; END;

CREATE TRIGGER IF NOT EXISTS file_folders_activity_insert AFTER INSERT ON file_folders BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.project_id AND owner=NEW.owner; END;

CREATE TRIGGER IF NOT EXISTS file_folders_activity_update AFTER UPDATE ON file_folders BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.project_id AND owner=NEW.owner; END;

CREATE TRIGGER IF NOT EXISTS files_activity_delete AFTER DELETE ON files BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=OLD.project_id AND owner=OLD.owner; END;

CREATE TRIGGER IF NOT EXISTS files_activity_insert AFTER INSERT ON files BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.project_id AND owner=NEW.owner; END;

CREATE TRIGGER IF NOT EXISTS files_activity_update AFTER UPDATE ON files BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.project_id AND owner=NEW.owner; END;

CREATE TRIGGER IF NOT EXISTS limit_field_insert BEFORE INSERT ON company_members WHEN NEW.status<>'disabled' AND NEW.seat_type='field' AND (SELECT COUNT(*)+1 FROM company_members WHERE owner=NEW.owner AND status<>'disabled' AND seat_type='field')>(SELECT CASE WHEN expires>strftime('%Y-%m-%dT%H:%M:%fZ','now') THEN COALESCE(override_field,field) ELSE field END FROM account_limits WHERE owner=NEW.owner AND enabled=1) BEGIN SELECT RAISE(ABORT,'PLANFLO_LIMIT_field'); END;

CREATE TRIGGER IF NOT EXISTS limit_field_update BEFORE UPDATE OF status,seat_type ON company_members WHEN NEW.status<>'disabled' AND NEW.seat_type='field' AND (OLD.status='disabled' OR OLD.seat_type<>NEW.seat_type) AND (SELECT COUNT(*)+1 FROM company_members WHERE owner=NEW.owner AND status<>'disabled' AND seat_type='field')>(SELECT CASE WHEN expires>strftime('%Y-%m-%dT%H:%M:%fZ','now') THEN COALESCE(override_field,field) ELSE field END FROM account_limits WHERE owner=NEW.owner AND enabled=1) BEGIN SELECT RAISE(ABORT,'PLANFLO_LIMIT_field'); END;

CREATE TRIGGER IF NOT EXISTS limit_office_insert BEFORE INSERT ON company_members WHEN NEW.status<>'disabled' AND NEW.seat_type='office' AND (SELECT COUNT(*)+2 FROM company_members WHERE owner=NEW.owner AND status<>'disabled' AND seat_type='office')>(SELECT CASE WHEN expires>strftime('%Y-%m-%dT%H:%M:%fZ','now') THEN COALESCE(override_office,office) ELSE office END FROM account_limits WHERE owner=NEW.owner AND enabled=1) BEGIN SELECT RAISE(ABORT,'PLANFLO_LIMIT_office'); END;

CREATE TRIGGER IF NOT EXISTS limit_office_update BEFORE UPDATE OF status,seat_type ON company_members WHEN NEW.status<>'disabled' AND NEW.seat_type='office' AND (OLD.status='disabled' OR OLD.seat_type<>NEW.seat_type) AND (SELECT COUNT(*)+2 FROM company_members WHERE owner=NEW.owner AND status<>'disabled' AND seat_type='office')>(SELECT CASE WHEN expires>strftime('%Y-%m-%dT%H:%M:%fZ','now') THEN COALESCE(override_office,office) ELSE office END FROM account_limits WHERE owner=NEW.owner AND enabled=1) BEGIN SELECT RAISE(ABORT,'PLANFLO_LIMIT_office'); END;

CREATE TRIGGER IF NOT EXISTS limit_project_insert BEFORE INSERT ON projects WHEN NEW.status IN ('Active','On hold') AND (SELECT COUNT(*)+1 FROM projects WHERE owner=NEW.owner AND status IN ('Active','On hold'))>(SELECT CASE WHEN expires>strftime('%Y-%m-%dT%H:%M:%fZ','now') THEN COALESCE(override_projects,projects) ELSE projects END FROM account_limits WHERE owner=NEW.owner AND enabled=1) BEGIN SELECT RAISE(ABORT,'PLANFLO_LIMIT_projects'); END;

CREATE TRIGGER IF NOT EXISTS limit_project_restore BEFORE UPDATE OF status ON projects WHEN NEW.status IN ('Active','On hold') AND OLD.status NOT IN ('Active','On hold') AND (SELECT COUNT(*)+1 FROM projects WHERE owner=NEW.owner AND status IN ('Active','On hold'))>(SELECT CASE WHEN expires>strftime('%Y-%m-%dT%H:%M:%fZ','now') THEN COALESCE(override_projects,projects) ELSE projects END FROM account_limits WHERE owner=NEW.owner AND enabled=1) BEGIN SELECT RAISE(ABORT,'PLANFLO_LIMIT_projects'); END;

CREATE TRIGGER IF NOT EXISTS limit_storage_file BEFORE INSERT ON files WHEN 1=1 AND (COALESCE((SELECT SUM(size) FROM files WHERE owner=NEW.owner),0)+COALESCE((SELECT SUM(r.size) FROM plan_revisions r JOIN files f ON f.id=r.file_id WHERE f.owner=NEW.owner AND r.id<>COALESCE(NULLIF(f.current_revision_id,''),f.id)),0)+NEW.size)>(SELECT CASE WHEN expires>strftime('%Y-%m-%dT%H:%M:%fZ','now') THEN COALESCE(override_bytes,bytes) ELSE bytes END FROM account_limits WHERE owner=NEW.owner AND enabled=1) BEGIN SELECT RAISE(ABORT,'PLANFLO_LIMIT_bytes'); END;

CREATE TRIGGER IF NOT EXISTS limit_storage_revision BEFORE INSERT ON plan_revisions WHEN NEW.id<>NEW.file_id AND (COALESCE((SELECT SUM(size) FROM files WHERE owner=(SELECT owner FROM files WHERE id=NEW.file_id)),0)+COALESCE((SELECT SUM(r.size) FROM plan_revisions r JOIN files f ON f.id=r.file_id WHERE f.owner=(SELECT owner FROM files WHERE id=NEW.file_id) AND r.id<>COALESCE(NULLIF(f.current_revision_id,''),f.id)),0)+NEW.size)>(SELECT CASE WHEN expires>strftime('%Y-%m-%dT%H:%M:%fZ','now') THEN COALESCE(override_bytes,bytes) ELSE bytes END FROM account_limits WHERE owner=(SELECT owner FROM files WHERE id=NEW.file_id) AND enabled=1) BEGIN SELECT RAISE(ABORT,'PLANFLO_LIMIT_bytes'); END;

CREATE TRIGGER IF NOT EXISTS om_manuals_activity_delete AFTER DELETE ON om_manuals BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=OLD.project_id AND owner=OLD.owner; END;

CREATE TRIGGER IF NOT EXISTS om_manuals_activity_insert AFTER INSERT ON om_manuals BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.project_id AND owner=NEW.owner; END;

CREATE TRIGGER IF NOT EXISTS om_manuals_activity_update AFTER UPDATE ON om_manuals BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.project_id AND owner=NEW.owner; END;

CREATE TRIGGER IF NOT EXISTS prevent_member_personal_app_settings BEFORE INSERT ON app_settings WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;

CREATE TRIGGER IF NOT EXISTS prevent_member_personal_billing_accounts BEFORE INSERT ON billing_accounts WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;

CREATE TRIGGER IF NOT EXISTS prevent_member_personal_builders BEFORE INSERT ON builders WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;

CREATE TRIGGER IF NOT EXISTS prevent_member_personal_company_members BEFORE INSERT ON company_members WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;

CREATE TRIGGER IF NOT EXISTS prevent_member_personal_file_folders BEFORE INSERT ON file_folders WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;

CREATE TRIGGER IF NOT EXISTS prevent_member_personal_files BEFORE INSERT ON files WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;

CREATE TRIGGER IF NOT EXISTS prevent_member_personal_om_manuals BEFORE INSERT ON om_manuals WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;

CREATE TRIGGER IF NOT EXISTS prevent_member_personal_payroll_config BEFORE INSERT ON payroll_config WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;

CREATE TRIGGER IF NOT EXISTS prevent_member_personal_payroll_reviews BEFORE INSERT ON payroll_reviews WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;

CREATE TRIGGER IF NOT EXISTS prevent_member_personal_projects BEFORE INSERT ON projects WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;

CREATE TRIGGER IF NOT EXISTS prevent_member_personal_records BEFORE INSERT ON records WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;

CREATE TRIGGER IF NOT EXISTS prevent_member_personal_safety_docs BEFORE INSERT ON safety_docs WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;

CREATE TRIGGER IF NOT EXISTS prevent_member_personal_schedule_entries BEFORE INSERT ON schedule_entries WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;

CREATE TRIGGER IF NOT EXISTS prevent_member_personal_settings BEFORE INSERT ON settings WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;

CREATE TRIGGER IF NOT EXISTS prevent_member_personal_subscriptions BEFORE INSERT ON subscriptions WHEN EXISTS(SELECT 1 FROM company_members WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'PLANFLO_MEMBERSHIP_CHANGED'); END;

CREATE TRIGGER IF NOT EXISTS projects_activity_insert AFTER INSERT ON projects BEGIN UPDATE projects SET last_activity=NEW.created WHERE id=NEW.id; END;

CREATE TRIGGER IF NOT EXISTS projects_activity_update AFTER UPDATE OF name,client,builder,address,number,contract,budget_hours,status,setup ON projects BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.id; END;

CREATE TRIGGER IF NOT EXISTS protect_owned_workspace_join BEFORE UPDATE OF user_id ON company_members WHEN NEW.user_id IS NOT NULL AND OLD.user_id IS NULL AND (EXISTS(SELECT 1 FROM settings WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM projects WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM records WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM files WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM file_folders WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM company_members WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM builders WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM safety_docs WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM om_manuals WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM schedule_entries WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM subscriptions WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM billing_accounts WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM app_settings WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM payroll_config WHERE owner=NEW.user_id) OR EXISTS(SELECT 1 FROM payroll_reviews WHERE owner=NEW.user_id)) BEGIN SELECT RAISE(ABORT,'PLANFLO_OWNER_HAS_WORKSPACE'); END;

CREATE TRIGGER IF NOT EXISTS records_activity_delete AFTER DELETE ON records BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=OLD.project_id AND owner=OLD.owner; END;

CREATE TRIGGER IF NOT EXISTS records_activity_insert AFTER INSERT ON records BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.project_id AND owner=NEW.owner; END;

CREATE TRIGGER IF NOT EXISTS records_activity_update AFTER UPDATE ON records BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.project_id AND owner=NEW.owner; END;

CREATE TRIGGER IF NOT EXISTS review_files_delete AFTER DELETE ON files WHEN OLD.category NOT IN ('logo','builder-logo') BEGIN
INSERT INTO review_activity(owner,project_id,source_type,source_id,category,title,operation,before_data,after_data,occurred) VALUES (OLD.owner,OLD.project_id,'files',OLD.id,'file:'||OLD.category,OLD.name,'delete',json_object('name',OLD.name,'category',OLD.category,'revision',OLD.revision_number,'archived',OLD.archived,'size',OLD.size),NULL,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

CREATE TRIGGER IF NOT EXISTS review_files_insert AFTER INSERT ON files WHEN NEW.category NOT IN ('logo','builder-logo') BEGIN
INSERT INTO review_activity(owner,project_id,source_type,source_id,category,title,operation,before_data,after_data,occurred) VALUES (NEW.owner,NEW.project_id,'files',NEW.id,'file:'||NEW.category,NEW.name,'insert',NULL,json_object('name',NEW.name,'category',NEW.category,'revision',NEW.revision_number,'archived',NEW.archived,'size',NEW.size),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

CREATE TRIGGER IF NOT EXISTS review_files_update AFTER UPDATE ON files WHEN NEW.category NOT IN ('logo','builder-logo') AND (NEW.name IS NOT OLD.name OR NEW.current_revision_id IS NOT OLD.current_revision_id OR NEW.archived IS NOT OLD.archived OR NEW.folder_id IS NOT OLD.folder_id) BEGIN
INSERT INTO review_activity(owner,project_id,source_type,source_id,category,title,operation,before_data,after_data,occurred) VALUES (NEW.owner,NEW.project_id,'files',NEW.id,'file:'||NEW.category,NEW.name,'update',json_object('name',OLD.name,'category',OLD.category,'revision',OLD.revision_number,'archived',OLD.archived,'size',OLD.size),json_object('name',NEW.name,'category',NEW.category,'revision',NEW.revision_number,'archived',NEW.archived,'size',NEW.size),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

CREATE TRIGGER IF NOT EXISTS review_om_manuals_delete AFTER DELETE ON om_manuals WHEN 1=1 BEGIN
INSERT INTO review_activity(owner,project_id,source_type,source_id,category,title,operation,before_data,after_data,occurred) VALUES (OLD.owner,OLD.project_id,'om_manuals',OLD.id,'om','O&M manual','delete',json_object('status',OLD.status,'data',json(OLD.data)),NULL,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

CREATE TRIGGER IF NOT EXISTS review_om_manuals_insert AFTER INSERT ON om_manuals WHEN 1=1 BEGIN
INSERT INTO review_activity(owner,project_id,source_type,source_id,category,title,operation,before_data,after_data,occurred) VALUES (NEW.owner,NEW.project_id,'om_manuals',NEW.id,'om','O&M manual','insert',NULL,json_object('status',NEW.status,'data',json(NEW.data)),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

CREATE TRIGGER IF NOT EXISTS review_om_manuals_update AFTER UPDATE ON om_manuals WHEN 1=1 AND (NEW.data IS NOT OLD.data OR NEW.status IS NOT OLD.status) BEGIN
INSERT INTO review_activity(owner,project_id,source_type,source_id,category,title,operation,before_data,after_data,occurred) VALUES (NEW.owner,NEW.project_id,'om_manuals',NEW.id,'om','O&M manual','update',json_object('status',OLD.status,'data',json(OLD.data)),json_object('status',NEW.status,'data',json(NEW.data)),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

CREATE TRIGGER IF NOT EXISTS review_records_delete AFTER DELETE ON records WHEN OLD.kind IN ('task','time','cost','rfi','variation','diary','ewp','test-tag') AND (OLD.kind<>'task' OR json_extract(OLD.data,'$.dailyReviewEvent') IS NULL) BEGIN
INSERT INTO review_activity(owner,project_id,source_type,source_id,category,title,operation,before_data,after_data,occurred) VALUES (OLD.owner,OLD.project_id,'records',OLD.id,'record:'||OLD.kind,OLD.title,'delete',json_object('title',OLD.title,'status',OLD.status,'data',json(OLD.data)),NULL,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

CREATE TRIGGER IF NOT EXISTS review_records_insert AFTER INSERT ON records WHEN NEW.kind IN ('task','time','cost','rfi','variation','diary','ewp','test-tag') AND (NEW.kind<>'task' OR json_extract(NEW.data,'$.dailyReviewEvent') IS NULL) BEGIN
INSERT INTO review_activity(owner,project_id,source_type,source_id,category,title,operation,before_data,after_data,occurred) VALUES (NEW.owner,NEW.project_id,'records',NEW.id,'record:'||NEW.kind,NEW.title,'insert',NULL,json_object('title',NEW.title,'status',NEW.status,'data',json(NEW.data)),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

CREATE TRIGGER IF NOT EXISTS review_records_update AFTER UPDATE ON records WHEN NEW.kind IN ('task','time','cost','rfi','variation','diary','ewp','test-tag') AND (NEW.kind<>'task' OR json_extract(NEW.data,'$.dailyReviewEvent') IS NULL) AND (NEW.title IS NOT OLD.title OR NEW.status IS NOT OLD.status OR NEW.data IS NOT OLD.data) BEGIN
INSERT INTO review_activity(owner,project_id,source_type,source_id,category,title,operation,before_data,after_data,occurred) VALUES (NEW.owner,NEW.project_id,'records',NEW.id,'record:'||NEW.kind,NEW.title,'update',json_object('title',OLD.title,'status',OLD.status,'data',json(OLD.data)),json_object('title',NEW.title,'status',NEW.status,'data',json(NEW.data)),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

CREATE TRIGGER IF NOT EXISTS review_safety_docs_delete AFTER DELETE ON safety_docs WHEN OLD.type='record' BEGIN
INSERT INTO review_activity(owner,project_id,source_type,source_id,category,title,operation,before_data,after_data,occurred) VALUES (OLD.owner,OLD.project_id,'safety_docs',OLD.id,'safety',OLD.title,'delete',json_object('title',OLD.title,'status',OLD.status,'data',json(OLD.data)),NULL,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

CREATE TRIGGER IF NOT EXISTS review_safety_docs_insert AFTER INSERT ON safety_docs WHEN NEW.type='record' BEGIN
INSERT INTO review_activity(owner,project_id,source_type,source_id,category,title,operation,before_data,after_data,occurred) VALUES (NEW.owner,NEW.project_id,'safety_docs',NEW.id,'safety',NEW.title,'insert',NULL,json_object('title',NEW.title,'status',NEW.status,'data',json(NEW.data)),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

CREATE TRIGGER IF NOT EXISTS review_safety_docs_update AFTER UPDATE ON safety_docs WHEN NEW.type='record' AND (NEW.data IS NOT OLD.data OR NEW.status IS NOT OLD.status OR NEW.title IS NOT OLD.title) BEGIN
INSERT INTO review_activity(owner,project_id,source_type,source_id,category,title,operation,before_data,after_data,occurred) VALUES (NEW.owner,NEW.project_id,'safety_docs',NEW.id,'safety',NEW.title,'update',json_object('title',OLD.title,'status',OLD.status,'data',json(OLD.data)),json_object('title',NEW.title,'status',NEW.status,'data',json(NEW.data)),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

CREATE TRIGGER IF NOT EXISTS safety_docs_activity_delete AFTER DELETE ON safety_docs BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=OLD.project_id AND owner=OLD.owner; END;

CREATE TRIGGER IF NOT EXISTS safety_docs_activity_insert AFTER INSERT ON safety_docs BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.project_id AND owner=NEW.owner; END;

CREATE TRIGGER IF NOT EXISTS safety_docs_activity_update AFTER UPDATE ON safety_docs BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.project_id AND owner=NEW.owner; END;

CREATE TRIGGER IF NOT EXISTS staff_feedback_task_insert AFTER INSERT ON feedback
WHEN NEW.status NOT IN ('Resolved','Closed') AND NOT EXISTS (SELECT 1 FROM deletion_requests WHERE owner=NEW.owner AND status IN ('Purging','Purged'))
BEGIN
 INSERT INTO staff_tasks(id,title,details,category,status,priority,company_owner,source_type,source_id,source_key,fingerprint,source_state,created,updated)
 VALUES('staff-ticket-'||NEW.id,'Review support · '||NEW.subject,NEW.sender_email||char(10)||substr(NEW.message,1,1800)||char(10)||'Next step: review the ticket and conversation, then respond or assign follow-up.','Support','Review',CASE WHEN NEW.impact='Blocking work' THEN 'Urgent' ELSE 'Normal' END,NEW.owner,'ticket',NEW.id,'ticket:'||NEW.id,CAST(NEW.version AS TEXT),NEW.status,NEW.created,NEW.updated)
 ON CONFLICT(source_key) DO NOTHING;
END;

CREATE TRIGGER IF NOT EXISTS staff_feedback_task_update AFTER UPDATE OF status,version ON feedback
WHEN NOT EXISTS (SELECT 1 FROM deletion_requests WHERE owner=NEW.owner AND status IN ('Purging','Purged'))
BEGIN
 UPDATE staff_tasks SET details=NEW.sender_email||char(10)||substr(NEW.message,1,1800)||char(10)||'Source status: '||NEW.status||'. Review the conversation and record the next step.',source_state=NEW.status,fingerprint=CAST(NEW.version AS TEXT),status=CASE WHEN NEW.status NOT IN ('Resolved','Closed') AND status IN ('Done','Dismissed') AND fingerprint<>CAST(NEW.version AS TEXT) THEN 'Review' ELSE status END,version=version+1,updated=NEW.updated
 WHERE source_key='ticket:'||NEW.id AND fingerprint<>CAST(NEW.version AS TEXT);
END;

INSERT INTO review_config(key,value) VALUES ('tracking_started',strftime('%Y-%m-%dT%H:%M:%fZ','now')) ON CONFLICT(key) DO NOTHING;
