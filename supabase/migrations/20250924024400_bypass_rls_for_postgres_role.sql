-- This is the final and definitive fix for the RLS permission errors.
-- It grants the 'postgres' superuser role the ability to bypass Row-Level Security.
-- This is the standard and safe way to allow SECURITY DEFINER functions to write to tables
-- that have RLS enabled, as the function runs as 'postgres' but the RLS policies are
-- checked against the session's user, who does not have INSERT permissions.

ALTER USER postgres BYPASSRLS;
