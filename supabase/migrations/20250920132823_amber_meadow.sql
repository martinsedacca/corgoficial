/*
  # Agregar campo de autorización a recetas

  1. Cambios
    - Agregar campo `authorized` (boolean) a la tabla `prescriptions`
    - Valor por defecto: false
    - Campo no nulo

  2. Descripción
    - Las recetas se crean como no autorizadas por defecto
    - Se pueden marcar como autorizadas posteriormente
    - Campo requerido para el control de autorizaciones
*/

-- Agregar campo de autorización a la tabla prescriptions
ALTER TABLE prescriptions 
ADD COLUMN authorized boolean NOT NULL DEFAULT false;

-- Crear índice para mejorar consultas por estado de autorización
CREATE INDEX idx_prescriptions_authorized ON prescriptions(authorized);