CREATE TABLE `review_activity` (
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
--> statement-breakpoint
CREATE INDEX `idx_review_activity_owner_id` ON `review_activity` (`owner`,`id`);--> statement-breakpoint
CREATE INDEX `idx_review_activity_source` ON `review_activity` (`owner`,`source_type`,`source_id`,`id`);--> statement-breakpoint
CREATE TABLE `review_config` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `review_decisions` (
	`event_id` integer PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`decision` text NOT NULL,
	`actor` text NOT NULL,
	`decided` text NOT NULL,
	`task_id` text
);
--> statement-breakpoint
CREATE INDEX `idx_review_decisions_owner` ON `review_decisions` (`owner`);
--> statement-breakpoint
INSERT INTO review_config(key,value) VALUES ('tracking_started',strftime('%Y-%m-%dT%H:%M:%fZ','now'));

--> statement-breakpoint
CREATE TRIGGER review_records_insert AFTER INSERT ON records WHEN NEW.kind IN ('task','time','cost','rfi','variation','diary','ewp','test-tag') AND (NEW.kind<>'task' OR json_extract(NEW.data,'$.dailyReviewEvent') IS NULL) BEGIN
INSERT INTO review_activity(owner,project_id,source_type,source_id,category,title,operation,before_data,after_data,occurred) VALUES (NEW.owner,NEW.project_id,'records',NEW.id,'record:'||NEW.kind,NEW.title,'insert',NULL,json_object('title',NEW.title,'status',NEW.status,'data',json(NEW.data)),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

--> statement-breakpoint
CREATE TRIGGER review_records_update AFTER UPDATE ON records WHEN NEW.kind IN ('task','time','cost','rfi','variation','diary','ewp','test-tag') AND (NEW.kind<>'task' OR json_extract(NEW.data,'$.dailyReviewEvent') IS NULL) AND (NEW.title IS NOT OLD.title OR NEW.status IS NOT OLD.status OR NEW.data IS NOT OLD.data) BEGIN
INSERT INTO review_activity(owner,project_id,source_type,source_id,category,title,operation,before_data,after_data,occurred) VALUES (NEW.owner,NEW.project_id,'records',NEW.id,'record:'||NEW.kind,NEW.title,'update',json_object('title',OLD.title,'status',OLD.status,'data',json(OLD.data)),json_object('title',NEW.title,'status',NEW.status,'data',json(NEW.data)),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

--> statement-breakpoint
CREATE TRIGGER review_records_delete AFTER DELETE ON records WHEN OLD.kind IN ('task','time','cost','rfi','variation','diary','ewp','test-tag') AND (OLD.kind<>'task' OR json_extract(OLD.data,'$.dailyReviewEvent') IS NULL) BEGIN
INSERT INTO review_activity(owner,project_id,source_type,source_id,category,title,operation,before_data,after_data,occurred) VALUES (OLD.owner,OLD.project_id,'records',OLD.id,'record:'||OLD.kind,OLD.title,'delete',json_object('title',OLD.title,'status',OLD.status,'data',json(OLD.data)),NULL,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

--> statement-breakpoint
CREATE TRIGGER review_files_insert AFTER INSERT ON files WHEN NEW.category NOT IN ('logo','builder-logo') BEGIN
INSERT INTO review_activity(owner,project_id,source_type,source_id,category,title,operation,before_data,after_data,occurred) VALUES (NEW.owner,NEW.project_id,'files',NEW.id,'file:'||NEW.category,NEW.name,'insert',NULL,json_object('name',NEW.name,'category',NEW.category,'revision',NEW.revision_number,'archived',NEW.archived,'size',NEW.size),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

--> statement-breakpoint
CREATE TRIGGER review_files_update AFTER UPDATE ON files WHEN NEW.category NOT IN ('logo','builder-logo') AND (NEW.name IS NOT OLD.name OR NEW.current_revision_id IS NOT OLD.current_revision_id OR NEW.archived IS NOT OLD.archived OR NEW.folder_id IS NOT OLD.folder_id) BEGIN
INSERT INTO review_activity(owner,project_id,source_type,source_id,category,title,operation,before_data,after_data,occurred) VALUES (NEW.owner,NEW.project_id,'files',NEW.id,'file:'||NEW.category,NEW.name,'update',json_object('name',OLD.name,'category',OLD.category,'revision',OLD.revision_number,'archived',OLD.archived,'size',OLD.size),json_object('name',NEW.name,'category',NEW.category,'revision',NEW.revision_number,'archived',NEW.archived,'size',NEW.size),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

--> statement-breakpoint
CREATE TRIGGER review_files_delete AFTER DELETE ON files WHEN OLD.category NOT IN ('logo','builder-logo') BEGIN
INSERT INTO review_activity(owner,project_id,source_type,source_id,category,title,operation,before_data,after_data,occurred) VALUES (OLD.owner,OLD.project_id,'files',OLD.id,'file:'||OLD.category,OLD.name,'delete',json_object('name',OLD.name,'category',OLD.category,'revision',OLD.revision_number,'archived',OLD.archived,'size',OLD.size),NULL,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

--> statement-breakpoint
CREATE TRIGGER review_safety_docs_insert AFTER INSERT ON safety_docs WHEN NEW.type='record' BEGIN
INSERT INTO review_activity(owner,project_id,source_type,source_id,category,title,operation,before_data,after_data,occurred) VALUES (NEW.owner,NEW.project_id,'safety_docs',NEW.id,'safety',NEW.title,'insert',NULL,json_object('title',NEW.title,'status',NEW.status,'data',json(NEW.data)),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

--> statement-breakpoint
CREATE TRIGGER review_safety_docs_update AFTER UPDATE ON safety_docs WHEN NEW.type='record' AND (NEW.data IS NOT OLD.data OR NEW.status IS NOT OLD.status OR NEW.title IS NOT OLD.title) BEGIN
INSERT INTO review_activity(owner,project_id,source_type,source_id,category,title,operation,before_data,after_data,occurred) VALUES (NEW.owner,NEW.project_id,'safety_docs',NEW.id,'safety',NEW.title,'update',json_object('title',OLD.title,'status',OLD.status,'data',json(OLD.data)),json_object('title',NEW.title,'status',NEW.status,'data',json(NEW.data)),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

--> statement-breakpoint
CREATE TRIGGER review_safety_docs_delete AFTER DELETE ON safety_docs WHEN OLD.type='record' BEGIN
INSERT INTO review_activity(owner,project_id,source_type,source_id,category,title,operation,before_data,after_data,occurred) VALUES (OLD.owner,OLD.project_id,'safety_docs',OLD.id,'safety',OLD.title,'delete',json_object('title',OLD.title,'status',OLD.status,'data',json(OLD.data)),NULL,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

--> statement-breakpoint
CREATE TRIGGER review_om_manuals_insert AFTER INSERT ON om_manuals WHEN 1=1 BEGIN
INSERT INTO review_activity(owner,project_id,source_type,source_id,category,title,operation,before_data,after_data,occurred) VALUES (NEW.owner,NEW.project_id,'om_manuals',NEW.id,'om','O&M manual','insert',NULL,json_object('status',NEW.status,'data',json(NEW.data)),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

--> statement-breakpoint
CREATE TRIGGER review_om_manuals_update AFTER UPDATE ON om_manuals WHEN 1=1 AND (NEW.data IS NOT OLD.data OR NEW.status IS NOT OLD.status) BEGIN
INSERT INTO review_activity(owner,project_id,source_type,source_id,category,title,operation,before_data,after_data,occurred) VALUES (NEW.owner,NEW.project_id,'om_manuals',NEW.id,'om','O&M manual','update',json_object('status',OLD.status,'data',json(OLD.data)),json_object('status',NEW.status,'data',json(NEW.data)),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;

--> statement-breakpoint
CREATE TRIGGER review_om_manuals_delete AFTER DELETE ON om_manuals WHEN 1=1 BEGIN
INSERT INTO review_activity(owner,project_id,source_type,source_id,category,title,operation,before_data,after_data,occurred) VALUES (OLD.owner,OLD.project_id,'om_manuals',OLD.id,'om','O&M manual','delete',json_object('status',OLD.status,'data',json(OLD.data)),NULL,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;
