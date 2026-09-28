ALTER TABLE `projects` ADD `last_activity` text DEFAULT '' NOT NULL;
--> statement-breakpoint
UPDATE projects SET last_activity = max(created, coalesce((SELECT max(created) FROM records WHERE project_id=projects.id), ''), coalesce((SELECT max(created) FROM files WHERE project_id=projects.id), ''), coalesce((SELECT max(updated) FROM safety_docs WHERE project_id=projects.id), ''), coalesce((SELECT max(updated) FROM om_manuals WHERE project_id=projects.id), ''), coalesce((SELECT max(r.created) FROM plan_revisions r JOIN files f ON f.id=r.file_id WHERE f.project_id=projects.id), ''));
--> statement-breakpoint
CREATE TRIGGER projects_activity_insert AFTER INSERT ON projects BEGIN UPDATE projects SET last_activity=NEW.created WHERE id=NEW.id; END;
--> statement-breakpoint
CREATE TRIGGER projects_activity_update AFTER UPDATE OF name,client,builder,address,number,contract,budget_hours,status,setup ON projects BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.id; END;
--> statement-breakpoint
CREATE TRIGGER records_activity_insert AFTER INSERT ON records BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.project_id AND owner=NEW.owner; END;
--> statement-breakpoint
CREATE TRIGGER records_activity_update AFTER UPDATE ON records BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.project_id AND owner=NEW.owner; END;
--> statement-breakpoint
CREATE TRIGGER records_activity_delete AFTER DELETE ON records BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=OLD.project_id AND owner=OLD.owner; END;
--> statement-breakpoint
CREATE TRIGGER files_activity_insert AFTER INSERT ON files BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.project_id AND owner=NEW.owner; END;
--> statement-breakpoint
CREATE TRIGGER files_activity_update AFTER UPDATE ON files BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.project_id AND owner=NEW.owner; END;
--> statement-breakpoint
CREATE TRIGGER files_activity_delete AFTER DELETE ON files BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=OLD.project_id AND owner=OLD.owner; END;
--> statement-breakpoint
CREATE TRIGGER file_folders_activity_insert AFTER INSERT ON file_folders BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.project_id AND owner=NEW.owner; END;
--> statement-breakpoint
CREATE TRIGGER file_folders_activity_update AFTER UPDATE ON file_folders BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.project_id AND owner=NEW.owner; END;
--> statement-breakpoint
CREATE TRIGGER file_folders_activity_delete AFTER DELETE ON file_folders BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=OLD.project_id AND owner=OLD.owner; END;
--> statement-breakpoint
CREATE TRIGGER safety_docs_activity_insert AFTER INSERT ON safety_docs BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.project_id AND owner=NEW.owner; END;
--> statement-breakpoint
CREATE TRIGGER safety_docs_activity_update AFTER UPDATE ON safety_docs BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.project_id AND owner=NEW.owner; END;
--> statement-breakpoint
CREATE TRIGGER safety_docs_activity_delete AFTER DELETE ON safety_docs BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=OLD.project_id AND owner=OLD.owner; END;
--> statement-breakpoint
CREATE TRIGGER om_manuals_activity_insert AFTER INSERT ON om_manuals BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.project_id AND owner=NEW.owner; END;
--> statement-breakpoint
CREATE TRIGGER om_manuals_activity_update AFTER UPDATE ON om_manuals BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.project_id AND owner=NEW.owner; END;
--> statement-breakpoint
CREATE TRIGGER om_manuals_activity_delete AFTER DELETE ON om_manuals BEGIN UPDATE projects SET last_activity=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=OLD.project_id AND owner=OLD.owner; END;
