-- This migration disables the generic triggers that are causing RLS policy violations.
-- We will replace this logic with specific RPC calls for each entity to ensure proper logging.

DROP TRIGGER IF EXISTS handle_patients_changes ON public.patients;
DROP TRIGGER IF EXISTS handle_doctors_changes ON public.doctors;
DROP TRIGGER IF EXISTS handle_social_works_changes ON public.social_works;
