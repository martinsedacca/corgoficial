/*
  # Add Dx field to prescriptions table

  1. New Fields
    - `dx` (text, nullable) - Diagnosis field for prescriptions
    - Limited to 1-2 lines of text for diagnosis information

  2. Security
    - Maintain existing RLS policies
    - No changes to permissions required

  3. Notes
    - Field is optional (nullable)
    - Will appear in forms and PDF generation
    - Positioned after additional_notes in the prescription
*/

-- Add the dx column to prescriptions table
ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS dx text;

-- Add comment for documentation
COMMENT ON COLUMN prescriptions.dx IS 'Diagnosis field - 1-2 lines maximum for prescription diagnosis';