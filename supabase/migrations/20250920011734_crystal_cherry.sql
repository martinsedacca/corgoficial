/*
  # Agregar campo apellido a pacientes

  1. Cambios en la tabla
    - Agregar columna `last_name` (apellido) como campo obligatorio
    - Migrar datos existentes separando nombre completo
    - Actualizar pacientes sin apellido con apellido genérico

  2. Datos
    - Separar nombres existentes en nombre y apellido
    - Asignar apellido genérico "Sin Apellido" a pacientes que no tengan
*/

-- Agregar columna last_name
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_name text;

-- Actualizar pacientes existentes separando nombre y apellido
DO $$
DECLARE
    patient_record RECORD;
    name_parts text[];
    first_name text;
    last_name text;
BEGIN
    FOR patient_record IN SELECT id, name FROM patients WHERE last_name IS NULL
    LOOP
        -- Separar el nombre en partes
        name_parts := string_to_array(trim(patient_record.name), ' ');
        
        IF array_length(name_parts, 1) >= 2 THEN
            -- Si hay al menos 2 palabras, la primera es nombre y el resto apellido
            first_name := name_parts[1];
            last_name := array_to_string(name_parts[2:], ' ');
        ELSE
            -- Si solo hay una palabra, usar como nombre y poner apellido genérico
            first_name := patient_record.name;
            last_name := 'Sin Apellido';
        END IF;
        
        -- Actualizar el registro
        UPDATE patients 
        SET 
            name = trim(first_name),
            last_name = trim(last_name)
        WHERE id = patient_record.id;
    END LOOP;
END $$;

-- Hacer la columna last_name obligatoria
ALTER TABLE patients ALTER COLUMN last_name SET NOT NULL;

-- Agregar índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_patients_last_name ON patients(last_name);
CREATE INDEX IF NOT EXISTS idx_patients_full_name ON patients(name, last_name);