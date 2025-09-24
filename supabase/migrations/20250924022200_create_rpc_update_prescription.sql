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
BEGIN
    -- Get user info
    BEGIN
        v_user_id := auth.uid();
        SELECT u.email INTO v_user_email FROM auth.users u WHERE u.id = v_user_id;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
        v_user_email := 'system';
    END;

    -- Capture old state of the prescription
    SELECT to_jsonb(p.*) INTO v_old_prescription FROM public.prescriptions p WHERE p.id = p_prescription_id;

    -- Capture old state of items
    SELECT jsonb_agg(to_jsonb(pi.*) ORDER BY pi.id) INTO v_old_items FROM public.prescription_items pi WHERE pi.prescription_id = p_prescription_id;

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
        updated_at = now() -- Ensure updated_at is always fresh
    WHERE id = p_prescription_id;

    -- Handle prescription items (the complex part)
    -- 1. Delete items that are no longer in the new list
    DELETE FROM public.prescription_items pi
    WHERE pi.prescription_id = p_prescription_id
      AND pi.id NOT IN (SELECT (item->>'id')::uuid FROM jsonb_array_elements(p_items_data) item WHERE item->>'id' IS NOT NULL);

    -- 2. Update existing items and insert new ones
    FOR v_new_items IN SELECT * FROM jsonb_array_elements(p_items_data)
    LOOP
        IF v_new_items->>'id' IS NOT NULL THEN -- Existing item, update it
            UPDATE public.prescription_items
            SET
                practice_id = (v_new_items->>'practice_id')::uuid,
                quantity = (v_new_items->>'quantity')::integer
            WHERE id = (v_new_items->>'id')::uuid;
        ELSE -- New item, insert it
            INSERT INTO public.prescription_items (prescription_id, practice_id, quantity)
            VALUES (p_prescription_id, (v_new_items->>'practice_id')::uuid, (v_new_items->>'quantity')::integer);
        END IF;
    END LOOP;

    -- Capture the final new state of the prescription and items
    SELECT to_jsonb(p.*) INTO v_new_prescription FROM public.prescriptions p WHERE p.id = p_prescription_id;
    SELECT jsonb_agg(to_jsonb(pi.*) ORDER BY pi.id) INTO v_new_items FROM public.prescription_items pi WHERE pi.prescription_id = p_prescription_id;

    -- Create a consolidated log entry
    INSERT INTO public.logs (user_id, user_email, action, entity, entity_id, previous_data, new_data, ip_address)
    VALUES (
        v_user_id,
        v_user_email,
        'UPDATE',
        'prescriptions',
        p_prescription_id,
        jsonb_build_object('prescription', v_old_prescription, 'items', v_old_items),
        jsonb_build_object('prescription', v_new_prescription, 'items', v_new_items),
        inet_client_addr()
    );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
