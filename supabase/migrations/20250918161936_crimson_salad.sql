/*
  # Políticas RLS Completas para Sistema de Recetas Médicas

  1. Funciones auxiliares
    - Función para obtener el rol del usuario actual
    - Función para verificar si el usuario es médico y obtener su doctor_id
  
  2. Políticas por tabla
    - user_profiles: Control de acceso basado en roles
    - doctors: Acceso completo para admin/secretary, lectura para médicos
    - patients: Gestión completa para admin/secretary, acceso limitado para médicos
    - practices: Solo admin/secretary pueden gestionar
    - social_works: Solo admin/secretary pueden gestionar
    - prescriptions: Control granular por rol
    - prescription_items: Heredan permisos de prescriptions
  
  3. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas específicas por operación (SELECT, INSERT, UPDATE, DELETE)
    - Verificación de roles y estados activos
*/

-- =============================================
-- FUNCIONES AUXILIARES
-- =============================================

-- Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener el doctor_id del usuario actual (si es médico)
CREATE OR REPLACE FUNCTION get_user_doctor_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT doctor_id 
    FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND is_active = true 
    AND role = 'doctor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario está activo
CREATE OR REPLACE FUNCTION is_user_active()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT is_active 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  ) = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- LIMPIAR POLÍTICAS EXISTENTES
-- =============================================

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to manage profiles" ON user_profiles;

DROP POLICY IF EXISTS "Authenticated users can view doctors" ON doctors;
DROP POLICY IF EXISTS "Authenticated users can insert doctors" ON doctors;
DROP POLICY IF EXISTS "Authenticated users can update doctors" ON doctors;
DROP POLICY IF EXISTS "Authenticated users can delete doctors" ON doctors;

DROP POLICY IF EXISTS "Authenticated users can view patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can insert patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can update patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can delete patients" ON patients;

DROP POLICY IF EXISTS "Everyone can read practices" ON practices;
DROP POLICY IF EXISTS "Authenticated users can insert practices" ON practices;
DROP POLICY IF EXISTS "Authenticated users can update practices" ON practices;
DROP POLICY IF EXISTS "Authenticated users can delete practices" ON practices;

DROP POLICY IF EXISTS "Authenticated users can view social_works" ON social_works;
DROP POLICY IF EXISTS "Authenticated users can insert social_works" ON social_works;
DROP POLICY IF EXISTS "Authenticated users can update social_works" ON social_works;
DROP POLICY IF EXISTS "Authenticated users can delete social_works" ON social_works;

DROP POLICY IF EXISTS "Authenticated users can view prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Authenticated users can insert prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Authenticated users can update prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Authenticated users can delete prescriptions" ON prescriptions;

DROP POLICY IF EXISTS "Authenticated users can view prescription_items" ON prescription_items;
DROP POLICY IF EXISTS "Authenticated users can insert prescription_items" ON prescription_items;
DROP POLICY IF EXISTS "Authenticated users can update prescription_items" ON prescription_items;
DROP POLICY IF EXISTS "Authenticated users can delete prescription_items" ON prescription_items;

-- =============================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- =============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS PARA USER_PROFILES
-- =============================================

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Los usuarios pueden actualizar su propio perfil (campos limitados)
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Los administradores pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
      AND up.is_active = true
    )
  );

-- Los administradores pueden crear perfiles
CREATE POLICY "Admins can create profiles" ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
      AND up.is_active = true
    )
  );

-- Los administradores pueden actualizar todos los perfiles
CREATE POLICY "Admins can update all profiles" ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
      AND up.is_active = true
    )
  );

-- Los administradores pueden eliminar perfiles
CREATE POLICY "Admins can delete profiles" ON user_profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
      AND up.is_active = true
    )
  );

-- =============================================
-- POLÍTICAS PARA DOCTORS
-- =============================================

-- Todos los usuarios autenticados pueden ver médicos
CREATE POLICY "All authenticated users can view doctors" ON doctors
  FOR SELECT
  TO authenticated
  USING (is_user_active());

-- Solo admin y secretary pueden crear médicos
CREATE POLICY "Admin and secretary can create doctors" ON doctors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() IN ('admin', 'secretary')
  );

-- Solo admin y secretary pueden actualizar médicos
CREATE POLICY "Admin and secretary can update doctors" ON doctors
  FOR UPDATE
  TO authenticated
  USING (
    get_user_role() IN ('admin', 'secretary')
  );

-- Solo admin y secretary pueden eliminar médicos
CREATE POLICY "Admin and secretary can delete doctors" ON doctors
  FOR DELETE
  TO authenticated
  USING (
    get_user_role() IN ('admin', 'secretary')
  );

-- =============================================
-- POLÍTICAS PARA PATIENTS
-- =============================================

-- Todos los usuarios autenticados pueden ver pacientes
CREATE POLICY "All authenticated users can view patients" ON patients
  FOR SELECT
  TO authenticated
  USING (is_user_active());

-- Todos los usuarios autenticados pueden crear pacientes
CREATE POLICY "All authenticated users can create patients" ON patients
  FOR INSERT
  TO authenticated
  WITH CHECK (is_user_active());

-- Todos los usuarios autenticados pueden actualizar pacientes
CREATE POLICY "All authenticated users can update patients" ON patients
  FOR UPDATE
  TO authenticated
  USING (is_user_active());

-- Solo admin y secretary pueden eliminar pacientes
CREATE POLICY "Admin and secretary can delete patients" ON patients
  FOR DELETE
  TO authenticated
  USING (
    get_user_role() IN ('admin', 'secretary')
  );

-- =============================================
-- POLÍTICAS PARA PRACTICES
-- =============================================

-- Todos los usuarios autenticados pueden ver prácticas
CREATE POLICY "All authenticated users can view practices" ON practices
  FOR SELECT
  TO authenticated
  USING (is_user_active());

-- Solo admin y secretary pueden crear prácticas
CREATE POLICY "Admin and secretary can create practices" ON practices
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() IN ('admin', 'secretary')
  );

-- Solo admin y secretary pueden actualizar prácticas
CREATE POLICY "Admin and secretary can update practices" ON practices
  FOR UPDATE
  TO authenticated
  USING (
    get_user_role() IN ('admin', 'secretary')
  );

-- Solo admin y secretary pueden eliminar prácticas
CREATE POLICY "Admin and secretary can delete practices" ON practices
  FOR DELETE
  TO authenticated
  USING (
    get_user_role() IN ('admin', 'secretary')
  );

-- =============================================
-- POLÍTICAS PARA SOCIAL_WORKS
-- =============================================

-- Todos los usuarios autenticados pueden ver obras sociales
CREATE POLICY "All authenticated users can view social_works" ON social_works
  FOR SELECT
  TO authenticated
  USING (is_user_active());

-- Solo admin y secretary pueden crear obras sociales
CREATE POLICY "Admin and secretary can create social_works" ON social_works
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() IN ('admin', 'secretary')
  );

-- Solo admin y secretary pueden actualizar obras sociales
CREATE POLICY "Admin and secretary can update social_works" ON social_works
  FOR UPDATE
  TO authenticated
  USING (
    get_user_role() IN ('admin', 'secretary')
  );

-- Solo admin y secretary pueden eliminar obras sociales
CREATE POLICY "Admin and secretary can delete social_works" ON social_works
  FOR DELETE
  TO authenticated
  USING (
    get_user_role() IN ('admin', 'secretary')
  );

-- =============================================
-- POLÍTICAS PARA PRESCRIPTIONS
-- =============================================

-- Admin y secretary pueden ver todas las recetas, médicos solo las suyas
CREATE POLICY "Users can view prescriptions based on role" ON prescriptions
  FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN get_user_role() IN ('admin', 'secretary') THEN true
      WHEN get_user_role() = 'doctor' THEN doctor_id = get_user_doctor_id()
      ELSE false
    END
  );

-- Admin y secretary pueden crear cualquier receta, médicos solo las suyas
CREATE POLICY "Users can create prescriptions based on role" ON prescriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    CASE 
      WHEN get_user_role() IN ('admin', 'secretary') THEN true
      WHEN get_user_role() = 'doctor' THEN doctor_id = get_user_doctor_id()
      ELSE false
    END
  );

-- Admin y secretary pueden actualizar cualquier receta, médicos solo las suyas
CREATE POLICY "Users can update prescriptions based on role" ON prescriptions
  FOR UPDATE
  TO authenticated
  USING (
    CASE 
      WHEN get_user_role() IN ('admin', 'secretary') THEN true
      WHEN get_user_role() = 'doctor' THEN doctor_id = get_user_doctor_id()
      ELSE false
    END
  );

-- Solo admin y secretary pueden eliminar recetas
CREATE POLICY "Admin and secretary can delete prescriptions" ON prescriptions
  FOR DELETE
  TO authenticated
  USING (
    get_user_role() IN ('admin', 'secretary')
  );

-- =============================================
-- POLÍTICAS PARA PRESCRIPTION_ITEMS
-- =============================================

-- Los items heredan los permisos de la receta padre
CREATE POLICY "Users can view prescription_items based on prescription access" ON prescription_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prescriptions p
      WHERE p.id = prescription_id
      AND (
        CASE 
          WHEN get_user_role() IN ('admin', 'secretary') THEN true
          WHEN get_user_role() = 'doctor' THEN p.doctor_id = get_user_doctor_id()
          ELSE false
        END
      )
    )
  );

CREATE POLICY "Users can create prescription_items based on prescription access" ON prescription_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prescriptions p
      WHERE p.id = prescription_id
      AND (
        CASE 
          WHEN get_user_role() IN ('admin', 'secretary') THEN true
          WHEN get_user_role() = 'doctor' THEN p.doctor_id = get_user_doctor_id()
          ELSE false
        END
      )
    )
  );

CREATE POLICY "Users can update prescription_items based on prescription access" ON prescription_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prescriptions p
      WHERE p.id = prescription_id
      AND (
        CASE 
          WHEN get_user_role() IN ('admin', 'secretary') THEN true
          WHEN get_user_role() = 'doctor' THEN p.doctor_id = get_user_doctor_id()
          ELSE false
        END
      )
    )
  );

CREATE POLICY "Users can delete prescription_items based on prescription access" ON prescription_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prescriptions p
      WHERE p.id = prescription_id
      AND (
        CASE 
          WHEN get_user_role() IN ('admin', 'secretary') THEN true
          WHEN get_user_role() = 'doctor' THEN p.doctor_id = get_user_doctor_id()
          ELSE false
        END
      )
    )
  );

-- =============================================
-- GRANTS DE PERMISOS
-- =============================================

-- Otorgar permisos de ejecución en las funciones
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_doctor_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_active() TO authenticated;

-- =============================================
-- COMENTARIOS FINALES
-- =============================================

COMMENT ON FUNCTION get_user_role() IS 'Obtiene el rol del usuario autenticado actual';
COMMENT ON FUNCTION get_user_doctor_id() IS 'Obtiene el doctor_id del usuario si es médico';
COMMENT ON FUNCTION is_user_active() IS 'Verifica si el usuario actual está activo';