CREATE TABLE `account_limits` (
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
--> statement-breakpoint
CREATE TABLE `customer_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`recipient` text DEFAULT '' NOT NULL,
	`ticket_id` text DEFAULT '' NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`author` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_customer_messages_owner` ON `customer_messages` (`owner`);--> statement-breakpoint
CREATE TABLE `deletion_requests` (
	`owner` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`reason` text NOT NULL,
	`requested` text NOT NULL,
	`eligible` text NOT NULL,
	`actor` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `message_reads` (
	`message_id` text NOT NULL,
	`user_id` text NOT NULL,
	`read` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_message_read` ON `message_reads` (`message_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `platform_operators` (
	`email` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `support_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`owner` text NOT NULL,
	`user_id` text NOT NULL,
	`reason` text NOT NULL,
	`expires` text NOT NULL,
	`created` text NOT NULL
);

--> statement-breakpoint
CREATE TRIGGER limit_project_insert BEFORE INSERT ON projects WHEN NEW.status IN ('Active','On hold') AND (SELECT COUNT(*)+1 FROM projects WHERE owner=NEW.owner AND status IN ('Active','On hold'))>(SELECT CASE WHEN expires>strftime('%Y-%m-%dT%H:%M:%fZ','now') THEN COALESCE(override_projects,projects) ELSE projects END FROM account_limits WHERE owner=NEW.owner AND enabled=1) BEGIN SELECT RAISE(ABORT,'PLANFLO_LIMIT_projects'); END;

--> statement-breakpoint
CREATE TRIGGER limit_project_restore BEFORE UPDATE OF status ON projects WHEN NEW.status IN ('Active','On hold') AND OLD.status NOT IN ('Active','On hold') AND (SELECT COUNT(*)+1 FROM projects WHERE owner=NEW.owner AND status IN ('Active','On hold'))>(SELECT CASE WHEN expires>strftime('%Y-%m-%dT%H:%M:%fZ','now') THEN COALESCE(override_projects,projects) ELSE projects END FROM account_limits WHERE owner=NEW.owner AND enabled=1) BEGIN SELECT RAISE(ABORT,'PLANFLO_LIMIT_projects'); END;

--> statement-breakpoint
CREATE TRIGGER limit_office_insert BEFORE INSERT ON company_members WHEN NEW.status<>'disabled' AND NEW.seat_type='office' AND (SELECT COUNT(*)+2 FROM company_members WHERE owner=NEW.owner AND status<>'disabled' AND seat_type='office')>(SELECT CASE WHEN expires>strftime('%Y-%m-%dT%H:%M:%fZ','now') THEN COALESCE(override_office,office) ELSE office END FROM account_limits WHERE owner=NEW.owner AND enabled=1) BEGIN SELECT RAISE(ABORT,'PLANFLO_LIMIT_office'); END;

--> statement-breakpoint
CREATE TRIGGER limit_office_update BEFORE UPDATE OF status,seat_type ON company_members WHEN NEW.status<>'disabled' AND NEW.seat_type='office' AND (OLD.status='disabled' OR OLD.seat_type<>NEW.seat_type) AND (SELECT COUNT(*)+2 FROM company_members WHERE owner=NEW.owner AND status<>'disabled' AND seat_type='office')>(SELECT CASE WHEN expires>strftime('%Y-%m-%dT%H:%M:%fZ','now') THEN COALESCE(override_office,office) ELSE office END FROM account_limits WHERE owner=NEW.owner AND enabled=1) BEGIN SELECT RAISE(ABORT,'PLANFLO_LIMIT_office'); END;

--> statement-breakpoint
CREATE TRIGGER limit_field_insert BEFORE INSERT ON company_members WHEN NEW.status<>'disabled' AND NEW.seat_type='field' AND (SELECT COUNT(*)+1 FROM company_members WHERE owner=NEW.owner AND status<>'disabled' AND seat_type='field')>(SELECT CASE WHEN expires>strftime('%Y-%m-%dT%H:%M:%fZ','now') THEN COALESCE(override_field,field) ELSE field END FROM account_limits WHERE owner=NEW.owner AND enabled=1) BEGIN SELECT RAISE(ABORT,'PLANFLO_LIMIT_field'); END;

--> statement-breakpoint
CREATE TRIGGER limit_field_update BEFORE UPDATE OF status,seat_type ON company_members WHEN NEW.status<>'disabled' AND NEW.seat_type='field' AND (OLD.status='disabled' OR OLD.seat_type<>NEW.seat_type) AND (SELECT COUNT(*)+1 FROM company_members WHERE owner=NEW.owner AND status<>'disabled' AND seat_type='field')>(SELECT CASE WHEN expires>strftime('%Y-%m-%dT%H:%M:%fZ','now') THEN COALESCE(override_field,field) ELSE field END FROM account_limits WHERE owner=NEW.owner AND enabled=1) BEGIN SELECT RAISE(ABORT,'PLANFLO_LIMIT_field'); END;

--> statement-breakpoint
CREATE TRIGGER limit_storage_file BEFORE INSERT ON files WHEN 1=1 AND (COALESCE((SELECT SUM(size) FROM files WHERE owner=NEW.owner),0)+COALESCE((SELECT SUM(r.size) FROM plan_revisions r JOIN files f ON f.id=r.file_id WHERE f.owner=NEW.owner AND r.id<>COALESCE(NULLIF(f.current_revision_id,''),f.id)),0)+NEW.size)>(SELECT CASE WHEN expires>strftime('%Y-%m-%dT%H:%M:%fZ','now') THEN COALESCE(override_bytes,bytes) ELSE bytes END FROM account_limits WHERE owner=NEW.owner AND enabled=1) BEGIN SELECT RAISE(ABORT,'PLANFLO_LIMIT_bytes'); END;

--> statement-breakpoint
CREATE TRIGGER limit_storage_revision BEFORE INSERT ON plan_revisions WHEN NEW.id<>NEW.file_id AND (COALESCE((SELECT SUM(size) FROM files WHERE owner=(SELECT owner FROM files WHERE id=NEW.file_id)),0)+COALESCE((SELECT SUM(r.size) FROM plan_revisions r JOIN files f ON f.id=r.file_id WHERE f.owner=(SELECT owner FROM files WHERE id=NEW.file_id) AND r.id<>COALESCE(NULLIF(f.current_revision_id,''),f.id)),0)+NEW.size)>(SELECT CASE WHEN expires>strftime('%Y-%m-%dT%H:%M:%fZ','now') THEN COALESCE(override_bytes,bytes) ELSE bytes END FROM account_limits WHERE owner=(SELECT owner FROM files WHERE id=NEW.file_id) AND enabled=1) BEGIN SELECT RAISE(ABORT,'PLANFLO_LIMIT_bytes'); END;
