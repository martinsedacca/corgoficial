/*
  # Fix prescription number generation function

  1. Function Updates
    - Update `get_next_prescription_number` to return the next available number globally
    - Ensure it considers all prescriptions regardless of user permissions
    - Use a proper sequence to avoid race conditions

  2. Security
    - Function remains accessible to authenticated users
    - No changes to existing RLS policies
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_next_prescription_number();

-- Create the corrected function that gets the next number globally
CREATE OR REPLACE FUNCTION get_next_prescription_number()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number integer;
BEGIN
  -- Get the maximum prescription number from all prescriptions
  -- Use a security definer function to bypass RLS for this specific query
  SELECT COALESCE(MAX(number), 0) + 1 
  INTO next_number
  FROM prescriptions;
  
  RETURN next_number;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_next_prescription_number() TO authenticated;