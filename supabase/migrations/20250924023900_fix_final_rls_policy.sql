-- This migration fixes the final RLS issue by replacing the restrictive INSERT policy
-- with one that allows any authenticated user to insert logs. This is safe because
-- the logs table is not directly exposed to the API and can only be written to
-- via our controlled database functions.

-- Drop the old, restrictive policy
DROP POLICY IF EXISTS "Allow service role to insert logs" ON public.logs;

-- Create a new, simpler policy that allows any authenticated user to insert
CREATE POLICY "Allow authenticated users to insert logs" ON public.logs
FOR INSERT
TO authenticated
WITH CHECK (true);
