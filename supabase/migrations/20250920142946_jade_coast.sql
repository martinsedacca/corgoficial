/*
  # Cambiar tipo de receta 'authorization' por 'surgery'

  1. Cambios en la tabla prescriptions
    - Actualizar todas las recetas existentes de tipo 'authorization' a 'surgery'
    - Actualizar la restricción CHECK para permitir 'surgery' en lugar de 'authorization'

  2. Notas importantes
    - Este cambio es retroactivo y afectará todas las recetas existentes
    - Se mantiene la compatibilidad con el resto del sistema
*/

-- Actualizar todas las recetas existentes de 'authorization' a 'surgery'
UPDATE prescriptions 
SET type = 'surgery' 
WHERE type = 'authorization';

-- Eliminar la restricción CHECK existente
ALTER TABLE prescriptions 
DROP CONSTRAINT IF EXISTS prescriptions_type_check;

-- Agregar nueva restricción CHECK con 'surgery' en lugar de 'authorization'
ALTER TABLE prescriptions 
ADD CONSTRAINT prescriptions_type_check 
CHECK (type = ANY (ARRAY['studies'::text, 'treatments'::text, 'surgery'::text]));