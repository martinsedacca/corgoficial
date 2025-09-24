-- Create ENUM types for structured logging if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_type') THEN
        CREATE TYPE public.action_type AS ENUM ('CREATE', 'UPDATE', 'DELETE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entity_type') THEN
        CREATE TYPE public.entity_type AS ENUM ('prescriptions', 'patients', 'doctors', 'users', 'social_works');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'log_status') THEN
        CREATE TYPE public.log_status AS ENUM ('SUCCESS', 'FAILURE');
    END IF;
END$$;

-- Create the logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    "timestamp" timestamptz NOT NULL DEFAULT now(),
    user_id uuid NULL,
    user_email text NULL,
    action action_type NOT NULL,
    entity entity_type NOT NULL,
    entity_id uuid NOT NULL,
    previous_data jsonb NULL,
    new_data jsonb NULL,
    ip_address inet NULL,
    status log_status NOT NULL DEFAULT 'SUCCESS'::public.log_status,
    error_message text NULL,
    CONSTRAINT logs_pkey PRIMARY KEY (id),
    CONSTRAINT logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add comments to the table and columns for clarity
COMMENT ON TABLE public.logs IS 'Audit trail for all major CUD (Create, Update, Delete) operations in the system.';
COMMENT ON COLUMN public.logs.id IS 'Unique identifier for the log entry.';
COMMENT ON COLUMN public.logs.timestamp IS 'Timestamp of when the event occurred.';
COMMENT ON COLUMN public.logs.user_id IS 'The ID of the user who performed the action. References auth.users.';
COMMENT ON COLUMN public.logs.user_email IS 'The email of the user for quick reference.';
COMMENT ON COLUMN public.logs.action IS 'The type of action performed (CREATE, UPDATE, DELETE).';
COMMENT ON COLUMN public.logs.entity IS 'The type of entity/table that was affected.';
COMMENT ON COLUMN public.logs.entity_id IS 'The ID of the specific record that was affected.';
COMMENT ON COLUMN public.logs.previous_data IS 'A JSONB object representing the state of the record before the change.';
COMMENT ON COLUMN public.logs.new_data IS 'A JSONB object representing the state of the record after the change.';
COMMENT ON COLUMN public.logs.ip_address IS 'The IP address from which the request was made.';
COMMENT ON COLUMN public.logs.status IS 'The status of the operation (SUCCESS or FAILURE).';
COMMENT ON COLUMN public.logs.error_message IS 'Details of the error if the operation failed.';

-- Enable Row Level Security
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
