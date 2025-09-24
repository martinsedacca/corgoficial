-- Migration to update logging functions to populate the new 'entity_description' field.

-- First, update the generic log_changes function for simple entities
CREATE OR REPLACE FUNCTION public.log_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
    v_user_email text;
    v_entity_name entity_type;
    v_entity_description text;
    v_record record;
BEGIN
    -- Determine which record to use (NEW for INSERT/UPDATE, OLD for DELETE)
    IF (TG_OP = 'DELETE') THEN
        v_record := OLD;
    ELSE
        v_record := NEW;
    END IF;

    -- Get user info
    BEGIN
        v_user_id := auth.uid();
        SELECT u.email INTO v_user_email FROM auth.users u WHERE u.id = v_user_id;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
        v_user_email := 'system';
    END;

    v_entity_name := TG_TABLE_NAME::entity_type;

    -- Generate entity description based on the table
    CASE v_entity_name
        WHEN 'patients' THEN
            v_entity_description := 'DNI: ' || v_record.dni;
        WHEN 'doctors' THEN
            v_entity_description := v_record.name;
        WHEN 'social_works' THEN
            v_entity_description := v_record.name;
        ELSE
            v_entity_description := NULL; -- Default for other tables
    END CASE;

    -- Insert into logs table
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
$$ LANGUAGE plpgsql;

-- Second, update the specific RPC function for prescriptions
CREATE OR REPLACE FUNCTION public.update_prescription_and_items(
    p_prescription_id uuid,
    p_prescription_data jsonb,
    p_items_data jsonb
)
RETURNS void AS $$
DECLARE
    v_old_prescription jsonb;
    v_new_prescription jsonb;
    v_old_items jsonb;
    v_new_items jsonb;
    v_user_id uuid;
    v_user_email text;
    v_item jsonb;
    v_entity_description text;
    v_patient_name text;
BEGIN
    -- (The logic for updating tables remains the same...)
    BEGIN
        v_user_id := auth.uid();
        SELECT u.email INTO v_user_email FROM auth.users u WHERE u.id = v_user_id;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
        v_user_email := 'system';
    END;

    SELECT to_jsonb(p.*) INTO v_old_prescription FROM public.prescriptions p WHERE p.id = p_prescription_id;
    SELECT jsonb_agg(to_jsonb(pi.*) ORDER BY pi.id) INTO v_old_items FROM public.prescription_items pi WHERE pi.prescription_id = p_prescription_id;

    UPDATE public.prescriptions
    SET 
        number = (p_prescription_data->>'number')::integer,
        type = p_prescription_data->>'type',
        date = (p_prescription_data->>'date')::date,
        doctor_id = (p_prescription_data->>'doctor_id')::uuid,
        patient_id = (p_prescription_data->>'patient_id')::uuid,
        authorized = (p_prescription_data->>'authorized')::boolean,
        dx = p_prescription_data->>'dx',
        additional_notes = p_prescription_data->>'additional_notes',
        updated_at = now()
    WHERE id = p_prescription_id;

    DELETE FROM public.prescription_items pi
    WHERE pi.prescription_id = p_prescription_id
      AND pi.id NOT IN (SELECT (item->>'id')::uuid FROM jsonb_array_elements(p_items_data) item WHERE item->>'id' IS NOT NULL);

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items_data)
    LOOP
        IF v_item->>'id' IS NOT NULL THEN
            UPDATE public.prescription_items
            SET practice_id = (v_item->>'practice_id')::uuid, ao = (v_item->>'ao')::text
            WHERE id = (v_item->>'id')::uuid;
        ELSE
            INSERT INTO public.prescription_items (prescription_id, practice_id, ao)
            VALUES (p_prescription_id, (v_item->>'practice_id')::uuid, (v_item->>'ao')::text);
        END IF;
    END LOOP;

    SELECT to_jsonb(p.*) INTO v_new_prescription FROM public.prescriptions p WHERE p.id = p_prescription_id;
    SELECT jsonb_agg(to_jsonb(pi.*) ORDER BY pi.id) INTO v_new_items FROM public.prescription_items pi WHERE pi.prescription_id = p_prescription_id;

    -- Generate the new entity description for the prescription
    SELECT p.name || ' ' || p.lastName INTO v_patient_name FROM public.patients p WHERE p.id = (p_prescription_data->>'patient_id')::uuid;
    v_entity_description := 'Receta #' || (p_prescription_data->>'number') || ' - ' || v_patient_name;

    -- Create a consolidated log entry with the new description
    INSERT INTO public.logs (user_id, user_email, action, entity, entity_id, entity_description, previous_data, new_data, ip_address)
    VALUES (
        v_user_id,
        v_user_email,
        'UPDATE',
        'prescriptions',
        p_prescription_id,
        v_entity_description,
        jsonb_build_object('prescription', v_old_prescription, 'items', v_old_items),
        jsonb_build_object('prescription', v_new_prescription, 'items', v_new_items),
        inet_client_addr()
    );

END;
$$ LANGUAGE plpgsql;
