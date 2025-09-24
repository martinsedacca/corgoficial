-- This is the final, definitive RLS fix. It removes all previous, conflicting policies
-- and creates only the two necessary policies from a clean slate.

-- 1. Clean up ALL existing policies on the logs table to prevent any conflicts.
DROP POLICY IF EXISTS "Allow admin to read all logs" ON public.logs;
DROP POLICY IF EXISTS "Allow service role to insert logs" ON public.logs;
DROP POLICY IF EXISTS "Allow authenticated users to insert logs" ON public.logs;
DROP POLICY IF EXISTS "Allow function owner to insert logs" ON public.logs;
DROP POLICY IF EXISTS "Allow superuser to insert logs" ON public.logs;

-- 2. Create the correct SELECT policy for the admin user.
CREATE POLICY "Allow admin to read all logs" ON public.logs
FOR SELECT
USING (auth.email() = 'm.sedacca@gmail.com');

-- 3. Create the correct INSERT policy for the postgres role.
-- This allows SECURITY DEFINER functions to write to the table.
CREATE POLICY "Allow postgres role to insert logs" ON public.logs
FOR INSERT TO postgres
WITH CHECK (true);
