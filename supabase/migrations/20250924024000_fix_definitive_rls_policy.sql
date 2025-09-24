-- This migration provides the definitive fix for the RLS issue.
-- It replaces the INSERT policy with one that checks for the function owner's UID,
-- which is the correct way to allow SECURITY DEFINER functions to write to a table with RLS.

-- Drop the previous incorrect policies
DROP POLICY IF EXISTS "Allow service role to insert logs" ON public.logs;
DROP POLICY IF EXISTS "Allow authenticated users to insert logs" ON public.logs;

-- Create the definitive INSERT policy
CREATE POLICY "Allow function owner to insert logs" ON public.logs
FOR INSERT
WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'postgres'));
