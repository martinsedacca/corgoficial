/*
  # Hacer número de afiliado opcional

  1. Cambios en tabla patients
    - Remover restricción NOT NULL del campo affiliate_number
    - Permitir valores NULL para este campo

  2. Notas
    - Los pacientes existentes mantendrán sus números de afiliado
    - Los nuevos pacientes podrán crearse sin número de afiliado
*/

-- Hacer el campo affiliate_number opcional (permitir NULL)
ALTER TABLE patients ALTER COLUMN affiliate_number DROP NOT NULL;