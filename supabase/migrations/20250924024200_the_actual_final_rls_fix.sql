-- This is the definitive RLS fix. It cleans up all previous, incorrect policies
-- and creates a simple, direct policy that grants the 'postgres' role (used by SECURITY DEFINER functions)
-- the necessary INSERT permissions on the logs table.

-- 1. Clean up all previous attempts to fix the policy
DROP POLICY IF EXISTS "Allow service role to insert logs" ON public.logs;
DROP POLICY IF EXISTS "Allow authenticated users to insert logs" ON public.logs;
DROP POLICY IF EXISTS "Allow function owner to insert logs" ON public.logs;

-- 2. Create the one, correct INSERT policy
-- This allows any function running as the postgres superuser to insert into the logs table.
CREATE POLICY "Allow superuser to insert logs" ON public.logs
FOR INSERT TO postgres
WITH CHECK (true);
