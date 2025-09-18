/*
  # Sistema de Autenticación con Roles

  1. Nuevas Tablas
    - `user_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `email` (text, unique)
      - `full_name` (text)
      - `role` (text, check constraint)
      - `doctor_id` (uuid, foreign key to doctors)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Funciones
    - `update_updated_at_column()` - Actualiza automáticamente updated_at
    - `get_user_role()` - Obtiene el rol del usuario actual
    - `get_next_prescription_number()` - Obtiene el siguiente número de receta

  3. Seguridad
    - Enable RLS en todas las tablas
    - Políticas específicas por rol para cada tabla
    - Restricciones de acceso según permisos
*/

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role FROM public.user_profiles WHERE user_id = auth.uid();
    RETURN user_role;
END;
$$;

-- Función para obtener el siguiente número de receta
CREATE OR REPLACE FUNCTION get_next_prescription_number()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    next_number integer;
BEGIN
    SELECT COALESCE(MAX(number), 0) + 1 INTO next_number FROM public.prescriptions;
    RETURN next_number;
END;
$$;

-- Crear tabla user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email text NOT NULL UNIQUE,
    full_name text NOT NULL,
    role text DEFAULT 'secretary' NOT NULL CHECK (role IN ('admin', 'secretary', 'doctor')),
    doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Habilitar RLS en user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Trigger para actualizar updated_at en user_profiles
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS en todas las tablas existentes si no está habilitado
DO $$
BEGIN
    -- Habilitar RLS en doctors
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'doctors' AND rowsecurity = true
    ) THEN
        ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Habilitar RLS en patients
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'patients' AND rowsecurity = true
    ) THEN
        ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Habilitar RLS en practices
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'practices' AND rowsecurity = true
    ) THEN
        ALTER TABLE public.practices ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Habilitar RLS en prescriptions
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'prescriptions' AND rowsecurity = true
    ) THEN
        ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Habilitar RLS en prescription_items
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'prescription_items' AND rowsecurity = true
    ) THEN
        ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Habilitar RLS en social_works
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'social_works' AND rowsecurity = true
    ) THEN
        ALTER TABLE public.social_works ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- POLÍTICAS PARA USER_PROFILES
-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Los admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Solo admins pueden crear perfiles
CREATE POLICY "Admins can create profiles"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Los admins pueden actualizar todos los perfiles
CREATE POLICY "Admins can update all profiles"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Solo admins pueden eliminar perfiles
CREATE POLICY "Admins can delete profiles"
ON public.user_profiles
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- POLÍTICAS PARA DOCTORS
-- Todos los usuarios autenticados pueden ver médicos
CREATE POLICY "All authenticated users can view doctors"
ON public.doctors
FOR SELECT
TO authenticated
USING (true);

-- Solo admins y secretarias pueden gestionar médicos
CREATE POLICY "Admins and secretaries can manage doctors"
ON public.doctors
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'secretary')
    )
);

-- POLÍTICAS PARA PATIENTS
-- Todos los usuarios autenticados pueden ver pacientes
CREATE POLICY "All authenticated users can view patients"
ON public.patients
FOR SELECT
TO authenticated
USING (true);

-- Todos los roles pueden crear y actualizar pacientes
CREATE POLICY "All authenticated users can create patients"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'secretary', 'doctor')
    )
);

CREATE POLICY "All authenticated users can update patients"
ON public.patients
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'secretary', 'doctor')
    )
);

-- Solo admins y secretarias pueden eliminar pacientes
CREATE POLICY "Admins and secretaries can delete patients"
ON public.patients
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'secretary')
    )
);

-- POLÍTICAS PARA PRACTICES
-- Todos los usuarios autenticados pueden ver prácticas
CREATE POLICY "All authenticated users can view practices"
ON public.practices
FOR SELECT
TO authenticated
USING (true);

-- Solo admins y secretarias pueden gestionar prácticas
CREATE POLICY "Admins and secretaries can manage practices"
ON public.practices
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'secretary')
    )
);

-- POLÍTICAS PARA SOCIAL_WORKS
-- Todos los usuarios autenticados pueden ver obras sociales
CREATE POLICY "All authenticated users can view social_works"
ON public.social_works
FOR SELECT
TO authenticated
USING (true);

-- Solo admins y secretarias pueden gestionar obras sociales
CREATE POLICY "Admins and secretaries can manage social_works"
ON public.social_works
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'secretary')
    )
);

-- POLÍTICAS PARA PRESCRIPTIONS
-- Admins y secretarias pueden ver todas las recetas
CREATE POLICY "Admins and secretaries can view all prescriptions"
ON public.prescriptions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'secretary')
    )
);

-- Los médicos solo pueden ver sus propias recetas
CREATE POLICY "Doctors can view own prescriptions"
ON public.prescriptions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() 
        AND role = 'doctor' 
        AND doctor_id = prescriptions.doctor_id
    )
);

-- Admins y secretarias pueden crear cualquier receta
CREATE POLICY "Admins and secretaries can create prescriptions"
ON public.prescriptions
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'secretary')
    )
);

-- Los médicos solo pueden crear recetas a su nombre
CREATE POLICY "Doctors can create own prescriptions"
ON public.prescriptions
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() 
        AND role = 'doctor' 
        AND doctor_id = prescriptions.doctor_id
    )
);

-- Admins y secretarias pueden actualizar cualquier receta
CREATE POLICY "Admins and secretaries can update prescriptions"
ON public.prescriptions
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'secretary')
    )
);

-- Los médicos solo pueden actualizar sus propias recetas
CREATE POLICY "Doctors can update own prescriptions"
ON public.prescriptions
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() 
        AND role = 'doctor' 
        AND doctor_id = prescriptions.doctor_id
    )
);

-- Admins y secretarias pueden eliminar cualquier receta
CREATE POLICY "Admins and secretaries can delete prescriptions"
ON public.prescriptions
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'secretary')
    )
);

-- Los médicos solo pueden eliminar sus propias recetas
CREATE POLICY "Doctors can delete own prescriptions"
ON public.prescriptions
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() 
        AND role = 'doctor' 
        AND doctor_id = prescriptions.doctor_id
    )
);

-- POLÍTICAS PARA PRESCRIPTION_ITEMS
-- Todos los usuarios autenticados pueden ver items de recetas
CREATE POLICY "All authenticated users can view prescription_items"
ON public.prescription_items
FOR SELECT
TO authenticated
USING (true);

-- Admins y secretarias pueden gestionar cualquier item
CREATE POLICY "Admins and secretaries can manage prescription_items"
ON public.prescription_items
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'secretary')
    )
);

-- Los médicos solo pueden gestionar items de sus propias recetas
CREATE POLICY "Doctors can manage own prescription_items"
ON public.prescription_items
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles up
        JOIN public.prescriptions p ON p.doctor_id = up.doctor_id
        WHERE up.user_id = auth.uid() 
        AND up.role = 'doctor' 
        AND p.id = prescription_items.prescription_id
    )
);

-- Crear triggers para updated_at en tablas existentes si no existen
DO $$
BEGIN
    -- Trigger para doctors
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_doctors_updated_at'
    ) THEN
        CREATE TRIGGER update_doctors_updated_at
            BEFORE UPDATE ON public.doctors
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Trigger para patients
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_patients_updated_at'
    ) THEN
        CREATE TRIGGER update_patients_updated_at
            BEFORE UPDATE ON public.patients
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Trigger para practices
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_practices_updated_at'
    ) THEN
        CREATE TRIGGER update_practices_updated_at
            BEFORE UPDATE ON public.practices
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Trigger para prescriptions
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_prescriptions_updated_at'
    ) THEN
        CREATE TRIGGER update_prescriptions_updated_at
            BEFORE UPDATE ON public.prescriptions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Trigger para social_works
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_social_works_updated_at'
    ) THEN
        CREATE TRIGGER update_social_works_updated_at
            BEFORE UPDATE ON public.social_works
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;