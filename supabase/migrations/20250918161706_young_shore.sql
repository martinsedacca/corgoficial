/*
  # Fix practices table RLS policies

  1. Security Changes
    - Drop existing conflicting policies on practices table
    - Create permissive policies for authenticated users
    - Ensure INSERT operations are allowed for authenticated users

  This resolves the 401 error when trying to insert practices data.
*/

-- Drop existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Allow authenticated users to insert practices" ON practices;
DROP POLICY IF EXISTS "Allow authenticated users to view practices" ON practices;
DROP POLICY IF EXISTS "Allow authenticated users to update practices" ON practices;
DROP POLICY IF EXISTS "Allow authenticated users to delete practices" ON practices;

-- Create simple, permissive policies for practices table
CREATE POLICY "Enable read access for authenticated users" ON practices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON practices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON practices
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON practices
  FOR DELETE USING (auth.role() = 'authenticated');