/*
  # Agregar campo DNI a pacientes

  1. Cambios en la tabla
    - Agregar columna `dni` (text, unique, not null)
    - Asignar DNI aleatorio de 8 dígitos a pacientes existentes
    - Crear índice único para evitar duplicados

  2. Seguridad
    - Mantener las políticas RLS existentes
    - El campo DNI será obligatorio para nuevos pacientes

  3. Notas
    - Se asignan DNIs aleatorios de 8 dígitos a pacientes existentes
    - El campo es único para evitar duplicados
*/

-- Agregar la columna DNI (inicialmente nullable para poder asignar valores)
ALTER TABLE patients ADD COLUMN dni text;

-- Asignar DNIs aleatorios de 8 dígitos a pacientes existentes
UPDATE patients 
SET dni = LPAD(FLOOR(RANDOM() * 100000000)::text, 8, '0')
WHERE dni IS NULL;

-- Hacer el campo obligatorio y único
ALTER TABLE patients 
ALTER COLUMN dni SET NOT NULL,
ADD CONSTRAINT patients_dni_unique UNIQUE (dni),
ADD CONSTRAINT patients_dni_check CHECK (dni ~ '^[0-9]{8}$');

-- Crear índice para mejorar performance en búsquedas por DNI
CREATE INDEX idx_patients_dni ON patients (dni);