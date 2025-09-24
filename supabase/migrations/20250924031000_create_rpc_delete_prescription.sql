-- This migration creates an RPC function to safely delete a prescription and its items,
-- while ensuring a detailed log of the deletion is created first.

CREATE OR REPLACE FUNCTION public.delete_prescription_and_log(
    p_prescription_id uuid,
    p_user_email text
)
RETURNS void AS $$
DECLARE
    v_old_prescription jsonb;
    v_old_items jsonb;
    v_entity_description text;
    v_patient_name text;
BEGIN
    -- 1. Capture the state of the prescription and its items before deleting
    SELECT to_jsonb(p.*) INTO v_old_prescription FROM public.prescriptions p WHERE p.id = p_prescription_id;
    SELECT jsonb_agg(to_jsonb(pi.*) ORDER BY pi.id) INTO v_old_items FROM public.prescription_items pi WHERE pi.prescription_id = p_prescription_id;

    -- If the prescription doesn't exist, exit gracefully
    IF v_old_prescription IS NULL THEN
        RETURN;
    END IF;

    -- 2. Generate entity description for the log
    SELECT p.name || ' ' || p.last_name INTO v_patient_name FROM public.patients p WHERE p.id = (v_old_prescription->>'patient_id')::uuid;
    v_entity_description := 'Receta #' || (v_old_prescription->>'number') || ' - ' || v_patient_name;

    -- 3. Create the log entry FIRST
    INSERT INTO public.logs (user_email, action, entity, entity_id, entity_description, previous_data, ip_address)
    VALUES (
        p_user_email,
        'DELETE',
        'prescriptions',
        p_prescription_id,
        v_entity_description,
        jsonb_build_object('prescription', v_old_prescription, 'items', v_old_items),
        inet_client_addr()
    );

    -- 4. Delete the prescription. Associated items will be deleted by CASCADE constraint.
    DELETE FROM public.prescriptions WHERE id = p_prescription_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
