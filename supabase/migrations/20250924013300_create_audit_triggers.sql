-- Create triggers for each table to be audited

-- Prescriptions Trigger
DROP TRIGGER IF EXISTS handle_prescriptions_changes ON public.prescriptions;
CREATE TRIGGER handle_prescriptions_changes
AFTER INSERT OR UPDATE OR DELETE ON public.prescriptions
FOR EACH ROW EXECUTE FUNCTION public.log_changes();

-- Patients Trigger
DROP TRIGGER IF EXISTS handle_patients_changes ON public.patients;
CREATE TRIGGER handle_patients_changes
AFTER INSERT OR UPDATE OR DELETE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.log_changes();

-- Doctors Trigger
DROP TRIGGER IF EXISTS handle_doctors_changes ON public.doctors;
CREATE TRIGGER handle_doctors_changes
AFTER INSERT OR UPDATE OR DELETE ON public.doctors
FOR EACH ROW EXECUTE FUNCTION public.log_changes();

-- The trigger for 'public.users' has been removed as the table does not exist.
-- User change auditing can be implemented later if a 'profiles' table is created.

-- Social Works Trigger
DROP TRIGGER IF EXISTS handle_social_works_changes ON public.social_works;
CREATE TRIGGER handle_social_works_changes
AFTER INSERT OR UPDATE OR DELETE ON public.social_works
FOR EACH ROW EXECUTE FUNCTION public.log_changes();

-- Add comments for clarity
COMMENT ON TRIGGER handle_prescriptions_changes ON public.prescriptions IS 'Audits all CUD operations on the prescriptions table.';
COMMENT ON TRIGGER handle_patients_changes ON public.patients IS 'Audits all CUD operations on the patients table.';
COMMENT ON TRIGGER handle_doctors_changes ON public.doctors IS 'Audits all CUD operations on the doctors table.';
COMMENT ON TRIGGER handle_social_works_changes ON public.social_works IS 'Audits all CUD operations on the social_works table.';
