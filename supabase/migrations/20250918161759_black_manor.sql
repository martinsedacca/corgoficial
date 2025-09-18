/*
  # Fix RLS policies for practices table

  1. Security Updates
    - Drop existing conflicting policies on practices table
    - Create proper RLS policies that check user roles from user_profiles table
    - Allow INSERT/UPDATE/DELETE for admin and secretary roles
    - Allow SELECT for all authenticated users

  2. Policy Details
    - Uses EXISTS clause to check user role in user_profiles table
    - Matches auth.uid() with user_id in user_profiles
    - Allows admin and secretary roles to manage practices
    - All authenticated users can view practices
*/

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON practices;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON practices;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON practices;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON practices;
DROP POLICY IF EXISTS "Allow authenticated users to view practices" ON practices;
DROP POLICY IF EXISTS "Allow authenticated users to insert practices" ON practices;
DROP POLICY IF EXISTS "Allow authenticated users to update practices" ON practices;
DROP POLICY IF EXISTS "Allow authenticated users to delete practices" ON practices;

-- Ensure RLS is enabled
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;

-- Create new policies with proper role checking
CREATE POLICY "Allow all authenticated users to view practices"
  ON practices
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin and secretary to insert practices"
  ON practices
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'secretary')
      AND is_active = true
    )
  );

CREATE POLICY "Allow admin and secretary to update practices"
  ON practices
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'secretary')
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'secretary')
      AND is_active = true
    )
  );

CREATE POLICY "Allow admin and secretary to delete practices"
  ON practices
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'secretary')
      AND is_active = true
    )
  );

-- If user_profiles table doesn't exist yet, create a temporary permissive policy
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    -- Temporary policy until user_profiles is created
    DROP POLICY IF EXISTS "Temporary allow all authenticated" ON practices;
    CREATE POLICY "Temporary allow all authenticated"
      ON practices
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;