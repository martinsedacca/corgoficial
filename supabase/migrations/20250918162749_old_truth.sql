/*
  # Configurar políticas RLS para tabla practices

  1. Políticas RLS
    - Habilitar RLS en tabla practices
    - Permitir SELECT a todos los usuarios autenticados
    - Permitir INSERT/UPDATE/DELETE solo a usuarios con rol admin o secretary
  
  2. Verificaciones
    - Verificar que el usuario esté en user_profiles
    - Verificar que el usuario tenga rol apropiado
    - Verificar que el usuario esté activo
*/

-- Habilitar RLS en la tabla practices
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes que puedan estar causando conflictos
DROP POLICY IF EXISTS "Admin and secretary can create practices" ON practices;
DROP POLICY IF EXISTS "Admin and secretary can update practices" ON practices;
DROP POLICY IF EXISTS "Admin and secretary can delete practices" ON practices;
DROP POLICY IF EXISTS "All authenticated users can view practices" ON practices;
DROP POLICY IF EXISTS "Allow admin and secretary to insert practices" ON practices;
DROP POLICY IF EXISTS "Allow admin and secretary to update practices" ON practices;
DROP POLICY IF EXISTS "Allow admin and secretary to delete practices" ON practices;
DROP POLICY IF EXISTS "Allow authenticated users to read practices" ON practices;

-- Política para SELECT - todos los usuarios autenticados pueden ver prácticas
CREATE POLICY "practices_select_policy" ON practices
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para INSERT - solo admin y secretary pueden crear prácticas
CREATE POLICY "practices_insert_policy" ON practices
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.role IN ('admin', 'secretary')
        AND user_profiles.is_active = true
    )
  );

-- Política para UPDATE - solo admin y secretary pueden actualizar prácticas
CREATE POLICY "practices_update_policy" ON practices
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.role IN ('admin', 'secretary')
        AND user_profiles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.role IN ('admin', 'secretary')
        AND user_profiles.is_active = true
    )
  );

-- Política para DELETE - solo admin y secretary pueden eliminar prácticas
CREATE POLICY "practices_delete_policy" ON practices
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.role IN ('admin', 'secretary')
        AND user_profiles.is_active = true
    )
  );