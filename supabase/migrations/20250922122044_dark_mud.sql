/*
  # Add created_by field to prescriptions table

  1. New Fields
    - `created_by` (uuid, nullable) - References auth.users(id)
  
  2. Data Migration
    - Assigns existing prescriptions to the first admin user found
    - If no admin user exists, leaves created_by as NULL
  
  3. Security Updates
    - Updates RLS policies for prescriptions
    - Doctors can only see prescriptions they created
    - Admin and secretary can see all prescriptions
  
  4. Performance
    - Adds index on created_by field for better query performance
*/

-- Add the created_by column first (nullable)
ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS created_by uuid;

-- Find the first admin user and assign existing prescriptions to them
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Try to find an admin user from user_profiles
    SELECT up.user_id INTO admin_user_id
    FROM user_profiles up
    WHERE up.role = 'admin' AND up.is_active = true
    LIMIT 1;
    
    -- If no admin found in profiles, try to find any user in auth.users
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id
        FROM auth.users
        LIMIT 1;
    END IF;
    
    -- Update existing prescriptions if we found a user
    IF admin_user_id IS NOT NULL THEN
        UPDATE prescriptions 
        SET created_by = admin_user_id 
        WHERE created_by IS NULL;
        
        RAISE NOTICE 'Updated prescriptions with user ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'No users found, prescriptions will have NULL created_by';
    END IF;
END $$;

-- Add foreign key constraint
ALTER TABLE prescriptions 
ADD CONSTRAINT prescriptions_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_created_by 
ON prescriptions(created_by);

-- Update RLS policies for prescriptions
DROP POLICY IF EXISTS "Users can view prescriptions based on role" ON prescriptions;
DROP POLICY IF EXISTS "Users can create prescriptions based on role" ON prescriptions;
DROP POLICY IF EXISTS "Users can update prescriptions based on role" ON prescriptions;
DROP POLICY IF EXISTS "Admin and secretary can delete prescriptions" ON prescriptions;

-- New policies with created_by logic
CREATE POLICY "Users can view prescriptions based on role and ownership"
ON prescriptions FOR SELECT
TO authenticated
USING (
  CASE
    WHEN (get_user_role() = ANY (ARRAY['admin'::text, 'secretary'::text])) THEN true
    WHEN (get_user_role() = 'doctor'::text) THEN (created_by = auth.uid())
    ELSE false
  END
);

CREATE POLICY "Users can create prescriptions based on role"
ON prescriptions FOR INSERT
TO authenticated
WITH CHECK (
  CASE
    WHEN (get_user_role() = ANY (ARRAY['admin'::text, 'secretary'::text])) THEN true
    WHEN (get_user_role() = 'doctor'::text) THEN (created_by = auth.uid())
    ELSE false
  END
);

CREATE POLICY "Users can update prescriptions based on role and ownership"
ON prescriptions FOR UPDATE
TO authenticated
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
    WHEN (get_user_role() = 'doctor'::text) THEN (created_by = auth.uid())
    ELSE false
  END
);

CREATE POLICY "Admin and secretary can delete prescriptions"
ON prescriptions FOR DELETE
TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::text, 'secretary'::text]));

-- Enable RLS if not already enabled
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;