/*
  # Agregar campo plan a la tabla patients

  1. Cambios en la tabla
    - Agregar columna `plan` (text, opcional) a la tabla `patients`
    - La columna será nullable para permitir que sea opcional

  2. Notas
    - Este campo almacenará el plan específico de la obra social del paciente
    - Es un campo opcional, por lo que puede ser NULL
*/

-- Agregar la columna plan a la tabla patients
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS plan text;

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN patients.plan IS 'Plan específico de la obra social del paciente (opcional)';