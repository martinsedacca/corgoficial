/*
  # Add created_by field to prescriptions table

  1. Schema Changes
    - Add `created_by` column to `prescriptions` table
    - Set default value for existing records to m.sedacca@gmail.com user ID
    - Add foreign key constraint to users table

  2. Data Migration
    - Update all existing prescriptions to have created_by = '77202b24-dedd-4f92-a940-bba0023aa6d1'

  3. Security Updates
    - Update RLS policies to filter prescriptions by created_by for doctors
    - Maintain existing access for admin and secretary roles
*/

-- Add created_by column to prescriptions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prescriptions' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE prescriptions ADD COLUMN created_by uuid;
  END IF;
END $$;

-- Update all existing prescriptions to have the specified user ID
UPDATE prescriptions 
SET created_by = '77202b24-dedd-4f92-a940-bba0023aa6d1'
WHERE created_by IS NULL;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'prescriptions_created_by_fkey'
  ) THEN
    ALTER TABLE prescriptions 
    ADD CONSTRAINT prescriptions_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update RLS policies to filter by created_by for doctors
DROP POLICY IF EXISTS "Users can view prescriptions based on role" ON prescriptions;
DROP POLICY IF EXISTS "Users can create prescriptions based on role" ON prescriptions;
DROP POLICY IF EXISTS "Users can update prescriptions based on role" ON prescriptions;

-- New policy for viewing prescriptions
CREATE POLICY "Users can view prescriptions based on role" ON prescriptions
FOR SELECT TO authenticated
USING (
  CASE
    WHEN (get_user_role() = ANY (ARRAY['admin'::text, 'secretary'::text])) THEN true
    WHEN (get_user_role() = 'doctor'::text) THEN (created_by = auth.uid())
    ELSE false
  END
);

-- New policy for creating prescriptions
CREATE POLICY "Users can create prescriptions based on role" ON prescriptions
FOR INSERT TO authenticated
WITH CHECK (
  CASE
    WHEN (get_user_role() = ANY (ARRAY['admin'::text, 'secretary'::text])) THEN true
    WHEN (get_user_role() = 'doctor'::text) THEN (doctor_id = get_user_doctor_id() AND created_by = auth.uid())
    ELSE false
  END
);

-- New policy for updating prescriptions
CREATE POLICY "Users can update prescriptions based on role" ON prescriptions
FOR UPDATE TO authenticated
USING (
  CASE
    WHEN (get_user_role() = ANY (ARRAY['admin'::text, 'secretary'::text])) THEN true
    WHEN (get_user_role() = 'doctor'::text) THEN (created_by = auth.uid())
    ELSE false
  END
)
WITH CHECK (
  CASE
    WHEN (get_user_role() = ANY (ARRAY['admin'::text, 'secretary'::text])) THEN true
    WHEN (get_user_role() = 'doctor'::text) THEN (doctor_id = get_user_doctor_id() AND created_by = auth.uid())
    ELSE false
  END
);

-- Update prescription_items policies to also check created_by
DROP POLICY IF EXISTS "Users can view prescription_items based on prescription access" ON prescription_items;
DROP POLICY IF EXISTS "Users can create prescription_items based on prescription acces" ON prescription_items;
DROP POLICY IF EXISTS "Users can update prescription_items based on prescription acces" ON prescription_items;
DROP POLICY IF EXISTS "Users can delete prescription_items based on prescription acces" ON prescription_items;

-- New policies for prescription_items
CREATE POLICY "Users can view prescription_items based on prescription access" ON prescription_items
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM prescriptions p
    WHERE p.id = prescription_items.prescription_id AND
    CASE
      WHEN (get_user_role() = ANY (ARRAY['admin'::text, 'secretary'::text])) THEN true
      WHEN (get_user_role() = 'doctor'::text) THEN (p.created_by = auth.uid())
      ELSE false
    END
  )
);

CREATE POLICY "Users can create prescription_items based on prescription access" ON prescription_items
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM prescriptions p
    WHERE p.id = prescription_items.prescription_id AND
    CASE
      WHEN (get_user_role() = ANY (ARRAY['admin'::text, 'secretary'::text])) THEN true
      WHEN (get_user_role() = 'doctor'::text) THEN (p.created_by = auth.uid())
      ELSE false
    END
  )
);

CREATE POLICY "Users can update prescription_items based on prescription access" ON prescription_items
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM prescriptions p
    WHERE p.id = prescription_items.prescription_id AND
    CASE
      WHEN (get_user_role() = ANY (ARRAY['admin'::text, 'secretary'::text])) THEN true
      WHEN (get_user_role() = 'doctor'::text) THEN (p.created_by = auth.uid())
      ELSE false
    END
  )
);

CREATE POLICY "Users can delete prescription_items based on prescription access" ON prescription_items
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM prescriptions p
    WHERE p.id = prescription_items.prescription_id AND
    CASE
      WHEN (get_user_role() = ANY (ARRAY['admin'::text, 'secretary'::text])) THEN true
      WHEN (get_user_role() = 'doctor'::text) THEN (p.created_by = auth.uid())
      ELSE false
    END
  )
);