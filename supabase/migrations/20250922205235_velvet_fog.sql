/*
  # Remove DNI length restriction

  1. Changes
    - Remove the CHECK constraint that enforces 8-digit DNI format
    - Allow DNI fields to have variable length (4+ characters)
  
  2. Security
    - Maintain existing RLS policies
    - No changes to table permissions
*/

-- Remove the existing DNI check constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'patients_dni_check' 
    AND table_name = 'patients'
  ) THEN
    ALTER TABLE patients DROP CONSTRAINT patients_dni_check;
  END IF;
END $$;

-- Add a new constraint that allows variable length DNI (minimum 4 characters)
ALTER TABLE patients ADD CONSTRAINT patients_dni_length_check 
CHECK (length(dni) >= 4 AND dni ~ '^[0-9]+$');