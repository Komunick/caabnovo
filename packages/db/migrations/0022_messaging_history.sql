-- Completed executions are evidence, never a queue of messages to release later.
CREATE FUNCTION protect_messaging_execution() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.status <> 'scheduled' OR NEW.status = 'scheduled' THEN
  RAISE EXCEPTION 'Messaging execution is immutable after completion' USING ERRCODE='55000';
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER messaging_execution_transition BEFORE UPDATE OF status,reason,completed_at,counts ON messaging_execution
 FOR EACH ROW EXECUTE FUNCTION protect_messaging_execution();
