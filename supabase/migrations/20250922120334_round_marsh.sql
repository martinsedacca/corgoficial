/*
  # Agregar campo created_by a prescriptions

  1. Cambios en la tabla
    - Agregar columna `created_by` (uuid) que referencia al usuario que creó la receta
    - Agregar foreign key constraint a user_profiles
    - Agregar índice para mejorar performance de consultas

  2. Seguridad
    - Actualizar políticas RLS para que médicos solo vean sus propias recetas creadas
    - Mantener acceso completo para admin y secretary
*/

-- Agregar columna created_by a la tabla prescriptions
ALTER TABLE prescriptions 
ADD COLUMN created_by uuid REFERENCES user_profiles(user_id) ON DELETE SET NULL;

-- Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_created_by ON prescriptions(created_by);

-- Actualizar política de SELECT para prescriptions
DROP POLICY IF EXISTS "Users can view prescriptions based on role" ON prescriptions;

CREATE POLICY "Users can view prescriptions based on role" ON prescriptions
FOR SELECT TO authenticated
USING (
  CASE
    WHEN (get_user_role() = ANY (ARRAY['admin'::text, 'secretary'::text])) THEN true
    WHEN (get_user_role() = 'doctor'::text) THEN (
      -- Los médicos solo pueden ver recetas que ellos mismos crearon
      created_by = uid()
    )
    ELSE false
  END
);

-- Actualizar política de INSERT para prescriptions
DROP POLICY IF EXISTS "Users can create prescriptions based on role" ON prescriptions;

CREATE POLICY "Users can create prescriptions based on role" ON prescriptions
FOR INSERT TO authenticated
WITH CHECK (
  CASE
    WHEN (get_user_role() = ANY (ARRAY['admin'::text, 'secretary'::text])) THEN true
    WHEN (get_user_role() = 'doctor'::text) THEN (
      -- Los médicos solo pueden crear recetas con su propio doctor_id y como created_by
      doctor_id = get_user_doctor_id() AND created_by = uid()
    )
    ELSE false
  END
);

-- Actualizar política de UPDATE para prescriptions
DROP POLICY IF EXISTS "Users can update prescriptions based on role" ON prescriptions;

CREATE POLICY "Users can update prescriptions based on role" ON prescriptions
FOR UPDATE TO authenticated
USING (
  CASE
    WHEN (get_user_role() = ANY (ARRAY['admin'::text, 'secretary'::text])) THEN true
    WHEN (get_user_role() = 'doctor'::text) THEN (
      -- Los médicos solo pueden actualizar recetas que ellos crearon
      created_by = uid()
    )
    ELSE false
  END
)
WITH CHECK (
  CASE
    WHEN (get_user_role() = ANY (ARRAY['admin'::text, 'secretary'::text])) THEN true
    WHEN (get_user_role() = 'doctor'::text) THEN (
      -- Los médicos solo pueden actualizar recetas manteniendo su doctor_id y created_by
      doctor_id = get_user_doctor_id() AND created_by = uid()
    )
    ELSE false
  END
);