/*
  # Fix RLS policies for practices table

  1. Security
    - Enable RLS on practices table
    - Add policy for authenticated users to read practices
    - Add policy for admin/secretary users to insert practices
    - Add policy for admin/secretary users to update practices
    - Add policy for admin/secretary users to delete practices

  This migration fixes the 401 error when trying to insert into the practices table
  by creating proper RLS policies that check user roles from user_profiles table.
*/

-- Enable RLS on practices table
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read practices" ON practices;
DROP POLICY IF EXISTS "Allow admin and secretary to insert practices" ON practices;
DROP POLICY IF EXISTS "Allow admin and secretary to update practices" ON practices;
DROP POLICY IF EXISTS "Allow admin and secretary to delete practices" ON practices;

-- Policy for SELECT (read) - all authenticated users can view practices
CREATE POLICY "Allow authenticated users to read practices"
  ON practices
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for INSERT - only admin and secretary can insert
CREATE POLICY "Allow admin and secretary to insert practices"
  ON practices
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id 
      FROM public.user_profiles 
      WHERE role IN ('admin', 'secretary') 
      AND is_active = true
    )
  );

-- Policy for UPDATE - only admin and secretary can update
CREATE POLICY "Allow admin and secretary to update practices"
  ON practices
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM public.user_profiles 
      WHERE role IN ('admin', 'secretary') 
      AND is_active = true
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id 
      FROM public.user_profiles 
      WHERE role IN ('admin', 'secretary') 
      AND is_active = true
    )
  );

-- Policy for DELETE - only admin and secretary can delete
CREATE POLICY "Allow admin and secretary to delete practices"
  ON practices
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM public.user_profiles 
      WHERE role IN ('admin', 'secretary') 
      AND is_active = true
    )
  );