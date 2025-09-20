/*
  # Agregar columna last_name a la tabla patients

  1. Cambios
    - Agregar columna `last_name` a la tabla `patients`
    - Migrar datos existentes separando nombres completos
    - Hacer la columna obligatoria después de migrar los datos
    - Asignar apellido genérico a pacientes sin apellido

  2. Migración de datos
    - Separar nombres completos existentes en nombre y apellido
    - Asignar "Sin Apellido" como apellido genérico para nombres de una sola palabra
*/

-- Agregar la columna last_name como nullable inicialmente
ALTER TABLE patients ADD COLUMN last_name text;

-- Migrar datos existentes: separar nombres completos
UPDATE patients 
SET last_name = CASE 
  WHEN position(' ' in name) > 0 THEN 
    trim(substring(name from position(' ' in name) + 1))
  ELSE 
    'Sin Apellido'
END;

-- Actualizar el campo name para que solo contenga el primer nombre
UPDATE patients 
SET name = CASE 
  WHEN position(' ' in name) > 0 THEN 
    trim(substring(name from 1 for position(' ' in name) - 1))
  ELSE 
    name
END;

-- Hacer la columna last_name obligatoria ahora que tiene datos
ALTER TABLE patients ALTER COLUMN last_name SET NOT NULL;

-- Actualizar el trigger de updated_at si existe
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at 
  BEFORE UPDATE ON patients 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();