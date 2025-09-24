-- Temporarily disable the old trigger on the prescriptions table
-- We will rely on our new RPC function to create a more detailed log.

DROP TRIGGER IF EXISTS handle_prescriptions_changes ON public.prescriptions;

-- Also ensure there's no trigger on prescription_items, just in case.
DROP TRIGGER IF EXISTS handle_prescription_items_changes ON public.prescription_items;

COMMENT ON TABLE public.prescriptions IS 'The trigger on this table has been temporarily disabled in favor of a dedicated RPC function for logging.';
