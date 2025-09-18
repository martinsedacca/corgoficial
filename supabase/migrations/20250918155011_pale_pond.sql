/*
  # Sistema de Autenticación y Roles

  1. Nuevas Tablas
    - `user_profiles` - Perfiles de usuario con roles y datos adicionales
    - Relación con auth.users de Supabase

  2. Roles
    - admin: Acceso completo
    - secretary: Acceso a todo excepto gestión de usuarios
    - doctor: Acceso limitado solo a sus recetas y pacientes

  3. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas específicas por rol
    - Restricciones en prescriptions para médicos
*/

-- Crear tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'secretary', 'doctor')),
  doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'admin' AND up.is_active = true
    )
  );

CREATE POLICY "Admins can manage all profiles"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'admin' AND up.is_active = true
    )
  );

-- Actualizar políticas de prescriptions para médicos
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON prescriptions;

CREATE POLICY "Admins and secretaries can manage all prescriptions"
  ON prescriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role IN ('admin', 'secretary') 
      AND up.is_active = true
    )
  );

CREATE POLICY "Doctors can manage own prescriptions"
  ON prescriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role = 'doctor' 
      AND up.doctor_id = prescriptions.doctor_id
      AND up.is_active = true
    )
  );

-- Actualizar políticas de prescription_items
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON prescription_items;

CREATE POLICY "Admins and secretaries can manage all prescription items"
  ON prescription_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role IN ('admin', 'secretary') 
      AND up.is_active = true
    )
  );

CREATE POLICY "Doctors can manage own prescription items"
  ON prescription_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN prescriptions p ON p.id = prescription_items.prescription_id
      WHERE up.user_id = auth.uid() 
      AND up.role = 'doctor' 
      AND up.doctor_id = p.doctor_id
      AND up.is_active = true
    )
  );

-- Actualizar políticas de patients para médicos (pueden crear/editar pero no eliminar)
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON patients;

CREATE POLICY "Admins and secretaries can manage all patients"
  ON patients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role IN ('admin', 'secretary') 
      AND up.is_active = true
    )
  );

CREATE POLICY "Doctors can read and modify patients"
  ON patients
  FOR SELECT, INSERT, UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role = 'doctor' 
      AND up.is_active = true
    )
  );

-- Actualizar políticas de doctors
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON doctors;

CREATE POLICY "Admins can manage all doctors"
  ON doctors
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role = 'admin' 
      AND up.is_active = true
    )
  );

CREATE POLICY "Secretaries can read all doctors"
  ON doctors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role IN ('admin', 'secretary') 
      AND up.is_active = true
    )
  );

CREATE POLICY "Doctors can read own profile"
  ON doctors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role = 'doctor' 
      AND up.doctor_id = doctors.id
      AND up.is_active = true
    )
  );

-- Actualizar políticas de practices
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON practices;

CREATE POLICY "Admins can manage all practices"
  ON practices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role = 'admin' 
      AND up.is_active = true
    )
  );

CREATE POLICY "Secretaries and doctors can read practices"
  ON practices
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role IN ('admin', 'secretary', 'doctor') 
      AND up.is_active = true
    )
  );

-- Actualizar políticas de social_works
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON social_works;

CREATE POLICY "Admins can manage all social works"
  ON social_works
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role = 'admin' 
      AND up.is_active = true
    )
  );

CREATE POLICY "Secretaries and doctors can read social works"
  ON social_works
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role IN ('admin', 'secretary', 'doctor') 
      AND up.is_active = true
    )
  );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Función para obtener el perfil del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  full_name text,
  role text,
  doctor_id uuid,
  is_active boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT up.id, up.user_id, up.email, up.full_name, up.role, up.doctor_id, up.is_active
  FROM user_profiles up
  WHERE up.user_id = auth.uid() AND up.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;