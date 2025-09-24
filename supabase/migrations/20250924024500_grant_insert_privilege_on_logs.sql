-- This is the final fix. It grants the fundamental INSERT privilege on the logs table
-- to the 'authenticated' role. This was the missing piece, as RLS policies are evaluated
-- only after base table privileges are checked.

GRANT INSERT ON TABLE public.logs TO authenticated;
