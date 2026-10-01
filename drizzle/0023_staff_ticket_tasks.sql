CREATE TRIGGER staff_feedback_task_insert AFTER INSERT ON feedback
WHEN NEW.status NOT IN ('Resolved','Closed') AND NOT EXISTS (SELECT 1 FROM deletion_requests WHERE owner=NEW.owner AND status IN ('Purging','Purged'))
BEGIN
 INSERT INTO staff_tasks(id,title,details,category,status,priority,company_owner,source_type,source_id,source_key,fingerprint,source_state,created,updated)
 VALUES('staff-ticket-'||NEW.id,'Review support · '||NEW.subject,NEW.sender_email||char(10)||substr(NEW.message,1,1800)||char(10)||'Next step: review the ticket and conversation, then respond or assign follow-up.','Support','Review',CASE WHEN NEW.impact='Blocking work' THEN 'Urgent' ELSE 'Normal' END,NEW.owner,'ticket',NEW.id,'ticket:'||NEW.id,CAST(NEW.version AS TEXT),NEW.status,NEW.created,NEW.updated)
 ON CONFLICT(source_key) DO NOTHING;
END;
--> statement-breakpoint
CREATE TRIGGER staff_feedback_task_update AFTER UPDATE OF status,version ON feedback
WHEN NOT EXISTS (SELECT 1 FROM deletion_requests WHERE owner=NEW.owner AND status IN ('Purging','Purged'))
BEGIN
 UPDATE staff_tasks SET details=NEW.sender_email||char(10)||substr(NEW.message,1,1800)||char(10)||'Source status: '||NEW.status||'. Review the conversation and record the next step.',source_state=NEW.status,fingerprint=CAST(NEW.version AS TEXT),status=CASE WHEN NEW.status NOT IN ('Resolved','Closed') AND status IN ('Done','Dismissed') AND fingerprint<>CAST(NEW.version AS TEXT) THEN 'Review' ELSE status END,version=version+1,updated=NEW.updated
 WHERE source_key='ticket:'||NEW.id AND fingerprint<>CAST(NEW.version AS TEXT);
END;
