CREATE OR REPLACE FUNCTION public.log_changes()
RETURNS TRIGGER AS $$
DECLARE
    user_id_val uuid;
    user_email_val text;
    entity_name entity_type;
BEGIN
    -- Attempt to get user information from the auth context
    -- This might fail if the operation is done by an anon user or service role, so we wrap it in a block
    BEGIN
        user_id_val := auth.uid();
        SELECT u.email INTO user_email_val FROM auth.users u WHERE u.id = user_id_val;
    EXCEPTION WHEN OTHERS THEN
        user_id_val := NULL;
        user_email_val := 'system'; -- Or some other placeholder for non-user actions
    END;

    -- Convert table name to our entity_type enum
    entity_name := TG_TABLE_NAME::entity_type;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.logs (user_id, user_email, action, entity, entity_id, new_data, ip_address)
        VALUES (
            user_id_val,
            user_email_val,
            'CREATE',
            entity_name,
            NEW.id,
            to_jsonb(NEW),
            inet_client_addr()
        );
        RETURN NEW;

    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.logs (user_id, user_email, action, entity, entity_id, previous_data, new_data, ip_address)
        VALUES (
            user_id_val,
            user_email_val,
            'UPDATE',
            entity_name,
            NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW),
            inet_client_addr()
        );
        RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.logs (user_id, user_email, action, entity, entity_id, previous_data, ip_address)
        VALUES (
            user_id_val,
            user_email_val,
            'DELETE',
            entity_name,
            OLD.id,
            to_jsonb(OLD),
            inet_client_addr()
        );
        RETURN OLD;

    END IF;

    RETURN NULL; -- The result is ignored for AFTER triggers

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.log_changes() IS 'A generic trigger function to record CREATE, UPDATE, and DELETE operations on specified tables into the logs table.';
