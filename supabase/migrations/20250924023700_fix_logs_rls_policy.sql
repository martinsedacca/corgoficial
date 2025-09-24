-- This migration fixes the RLS policy on the logs table by allowing inserts
-- from the service role, which is used by SECURITY DEFINER functions.
-- It also ensures the generic log_changes function runs as SECURITY DEFINER.

-- 1. Add an INSERT policy for the service role
DROP POLICY IF EXISTS "Allow service role to insert logs" ON public.logs;
CREATE POLICY "Allow service role to insert logs" ON public.logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- 2. Re-affirm that the generic trigger function uses SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.log_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
    v_user_email text;
    v_entity_name entity_type;
    v_entity_description text;
    v_record record;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_record := OLD;
    ELSE
        v_record := NEW;
    END IF;

    BEGIN
        v_user_id := auth.uid();
        SELECT u.email INTO v_user_email FROM auth.users u WHERE u.id = v_user_id;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
        v_user_email := 'system';
    END;

    v_entity_name := TG_TABLE_NAME::entity_type;

    CASE v_entity_name
        WHEN 'patients' THEN
            v_entity_description := 'DNI: ' || v_record.dni;
        WHEN 'doctors' THEN
            v_entity_description := v_record.name;
        WHEN 'social_works' THEN
            v_entity_description := v_record.name;
        ELSE
            v_entity_description := NULL;
    END CASE;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.logs (user_id, user_email, action, entity, entity_id, entity_description, new_data, ip_address)
        VALUES (v_user_id, v_user_email, 'CREATE', v_entity_name, NEW.id, v_entity_description, to_jsonb(NEW), inet_client_addr());
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.logs (user_id, user_email, action, entity, entity_id, entity_description, previous_data, new_data, ip_address)
        VALUES (v_user_id, v_user_email, 'UPDATE', v_entity_name, NEW.id, v_entity_description, to_jsonb(OLD), to_jsonb(NEW), inet_client_addr());
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.logs (user_id, user_email, action, entity, entity_id, entity_description, previous_data, ip_address)
        VALUES (v_user_id, v_user_email, 'DELETE', v_entity_name, OLD.id, v_entity_description, to_jsonb(OLD), inet_client_addr());
    END IF;

    RETURN v_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- Ensure SECURITY DEFINER is present
