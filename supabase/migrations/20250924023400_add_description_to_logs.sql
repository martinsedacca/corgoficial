-- Add a new column to store a human-readable description of the entity
ALTER TABLE public.logs ADD COLUMN IF NOT EXISTS entity_description TEXT;

COMMENT ON COLUMN public.logs.entity_description IS 'A human-readable summary of the logged entity (e.g., Patient DNI, Prescription Number + Patient Name).';
