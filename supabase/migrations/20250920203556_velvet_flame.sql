/*
  # Crear usuario administrador inicial

  1. Función para crear usuario administrador
    - Crea el usuario en auth.users si no existe
    - Crea el perfil en user_profiles
    - Asigna rol de administrador

  2. Ejecutar creación del usuario admin
    - Email: m.sedacca@gmail.com
    - Contraseña: admin1234
    - Rol: admin
    - Activo: true
*/

-- Función para crear usuario administrador
CREATE OR REPLACE FUNCTION create_admin_user(
  user_email TEXT,
  user_password TEXT,
  user_full_name TEXT
) RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
  existing_user_id UUID;
BEGIN
  -- Verificar si el usuario ya existe
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF existing_user_id IS NOT NULL THEN
    -- Usuario ya existe, actualizar perfil si es necesario
    INSERT INTO user_profiles (user_id, email, full_name, role, is_active)
    VALUES (existing_user_id, user_email, user_full_name, 'admin', true)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      full_name = EXCLUDED.full_name,
      role = 'admin',
      is_active = true,
      updated_at = now();
    
    RETURN existing_user_id;
  END IF;
  
  -- Crear nuevo usuario
  new_user_id := gen_random_uuid();
  
  -- Insertar en auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    user_email,
    crypt(user_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    'authenticated',
    'authenticated'
  );
  
  -- Crear perfil de usuario
  INSERT INTO user_profiles (
    user_id,
    email,
    full_name,
    role,
    is_active
  ) VALUES (
    new_user_id,
    user_email,
    user_full_name,
    'admin',
    true
  );
  
  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear usuario administrador
SELECT create_admin_user(
  'm.sedacca@gmail.com',
  'admin1234',
  'Administrador'
);

-- Limpiar función temporal
DROP FUNCTION create_admin_user(TEXT, TEXT, TEXT);