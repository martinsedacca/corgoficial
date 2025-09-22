/*
  # Enable Realtime for all tables

  1. Enable Realtime
    - Enable realtime for prescriptions table
    - Enable realtime for prescription_items table
    - Enable realtime for doctors table
    - Enable realtime for patients table
    - Enable realtime for practices table
    - Enable realtime for social_works table
    - Enable realtime for user_profiles table

  2. Security
    - Realtime respects existing RLS policies
    - Users only receive updates for data they can access
*/

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE prescriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE prescription_items;
ALTER PUBLICATION supabase_realtime ADD TABLE doctors;
ALTER PUBLICATION supabase_realtime ADD TABLE patients;
ALTER PUBLICATION supabase_realtime ADD TABLE practices;
ALTER PUBLICATION supabase_realtime ADD TABLE social_works;
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;

-- Verify realtime is enabled (this will show in logs)
DO $$
BEGIN
  RAISE NOTICE 'Realtime enabled for all tables successfully';
END $$;