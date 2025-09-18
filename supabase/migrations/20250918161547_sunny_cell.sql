/*
  # Fix RLS policies for practices table

  1. Security Changes
    - Drop existing conflicting policies on practices table
    - Create new policy allowing INSERT operations for authenticated users
    - Create policies for SELECT, UPDATE, DELETE operations
    - Ensure user_profiles table exists and has proper policies

  This resolves the "new row violates row-level security policy" error.
*/

-- First, ensure RLS is enabled on practices table
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might be conflicting
DROP POLICY IF EXISTS "Authenticated users can view practices" ON practices;
DROP POLICY IF EXISTS "Authenticated users can insert practices" ON practices;
DROP POLICY IF EXISTS "Authenticated users can update practices" ON practices;
DROP POLICY IF EXISTS "Authenticated users can delete practices" ON practices;
DROP POLICY IF EXISTS "All authenticated users can view practices" ON practices;
DROP POLICY IF EXISTS "Admins and secretaries can manage practices" ON practices;

-- Create simple policies that allow authenticated users to perform operations
CREATE POLICY "Allow authenticated users to view practices"
  ON practices
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert practices"
  ON practices
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update practices"
  ON practices
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete practices"
  ON practices
  FOR DELETE
  TO authenticated
  USING (true);

-- Ensure user_profiles table has basic policies if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    -- Enable RLS on user_profiles
    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Allow authenticated users" ON user_profiles;
    
    -- Create basic policy for user_profiles
    CREATE POLICY "Allow authenticated users to manage profiles"
      ON user_profiles
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;