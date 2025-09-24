-- Create a policy to allow read access to a specific user
DROP POLICY IF EXISTS "Allow admin to read all logs" ON public.logs;
CREATE POLICY "Allow admin to read all logs" ON public.logs
FOR SELECT
TO authenticated
USING (auth.email() = 'm.sedacca@gmail.com');

-- Note: By default, no one can INSERT, UPDATE, or DELETE logs directly through the API.
-- The logs are only created via the trigger function, which runs with SECURITY DEFINER privileges.

COMMENT ON POLICY "Allow admin to read all logs" ON public.logs IS 'Ensures that only the specified admin user can read from the logs table.';
