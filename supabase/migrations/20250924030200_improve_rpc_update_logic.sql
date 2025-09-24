-- This migration refines the RPC function to prevent re-creating items that haven't changed.
-- It implements a more intelligent diffing logic to only DELETE, UPDATE, or INSERT what is necessary.

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
    v_old_item_ids uuid[];
    v_new_item_ids uuid[];
BEGIN
    -- Get user info
    BEGIN
        v_user_id := auth.uid();
        SELECT u.email INTO v_user_email FROM auth.users u WHERE u.id = v_user_id;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
        v_user_email := 'system';
    END;

    -- Capture old state of the prescription and items
    SELECT to_jsonb(p.*) INTO v_old_prescription FROM public.prescriptions p WHERE p.id = p_prescription_id;
    SELECT jsonb_agg(to_jsonb(pi.*) ORDER BY pi.id) INTO v_old_items FROM public.prescription_items pi WHERE pi.prescription_id = p_prescription_id;
    SELECT array_agg(id) INTO v_old_item_ids FROM public.prescription_items WHERE prescription_id = p_prescription_id;

    -- Update the main prescription table
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

    -- Intelligent item handling
    v_new_item_ids := ARRAY(SELECT (item->>'id')::uuid FROM jsonb_array_elements(p_items_data) item WHERE item->>'id' IS NOT NULL);

    -- 1. Delete items that are in the old list but not the new one
    IF array_length(v_old_item_ids, 1) > 0 THEN
        DELETE FROM public.prescription_items
        WHERE prescription_id = p_prescription_id AND id = ANY(v_old_item_ids) AND NOT (id = ANY(v_new_item_ids));
    END IF;

    -- 2. Update or Insert items from the new list
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items_data)
    LOOP
        IF v_item->>'id' IS NOT NULL AND (v_item->>'id')::uuid = ANY(v_old_item_ids) THEN -- It's an existing item, so update it
            UPDATE public.prescription_items
            SET ao = (v_item->>'ao')::text
            WHERE id = (v_item->>'id')::uuid AND ao IS DISTINCT FROM (v_item->>'ao')::text; -- Only update if changed
        ELSE -- It's a new item, so insert it
            INSERT INTO public.prescription_items (prescription_id, practice_id, ao)
            VALUES (p_prescription_id, (v_item->>'practice_id')::uuid, (v_item->>'ao')::text);
        END IF;
    END LOOP;

    -- Capture the final new state
    SELECT to_jsonb(p.*) INTO v_new_prescription FROM public.prescriptions p WHERE p.id = p_prescription_id;
    SELECT jsonb_agg(to_jsonb(pi.*) ORDER BY pi.id) INTO v_new_items FROM public.prescription_items pi WHERE pi.prescription_id = p_prescription_id;

    -- Generate the entity description
    SELECT p.name || ' ' || p.last_name INTO v_patient_name FROM public.patients p WHERE p.id = (p_prescription_data->>'patient_id')::uuid;
    v_entity_description := 'Receta #' || (p_prescription_data->>'number') || ' - ' || v_patient_name;

    -- Only log if there are actual changes
    IF v_old_prescription IS DISTINCT FROM v_new_prescription OR v_old_items IS DISTINCT FROM v_new_items THEN
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
    END IF;

END;
$$ LANGUAGE plpgsql;
