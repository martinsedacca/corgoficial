/*
  # Create social works table

  1. New Tables
    - `social_works`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `code` (text, unique, optional)
      - `description` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `social_works` table
    - Add policy for authenticated users to manage social works

  3. Initial Data
    - Insert common social works in Argentina
*/

CREATE TABLE IF NOT EXISTS social_works (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  code text UNIQUE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE social_works ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users"
  ON social_works
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'update_social_works_updated_at'
  ) THEN
    CREATE TRIGGER update_social_works_updated_at
      BEFORE UPDATE ON social_works
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insertar obras sociales comunes de Argentina
INSERT INTO social_works (name, code, description) VALUES
  ('OSDE', 'OSDE', 'Organización de Servicios Directos Empresarios'),
  ('Swiss Medical', 'SWISS', 'Swiss Medical Group'),
  ('IOMA', 'IOMA', 'Instituto de Obra Médico Asistencial'),
  ('Galeno', 'GALENO', 'Galeno Argentina'),
  ('Medicus', 'MEDICUS', 'Medicus'),
  ('OSECAC', 'OSECAC', 'Obra Social de Empleados de Comercio y Actividades Civiles'),
  ('OSPRERA', 'OSPRERA', 'Obra Social del Personal Rural y Estibadores de la República Argentina'),
  ('OSPLAD', 'OSPLAD', 'Obra Social del Personal de la Actividad del Turf'),
  ('OSDEPYM', 'OSDEPYM', 'Obra Social de Directivos de Empresas Privadas y Mixtas'),
  ('OSUTHGRA', 'OSUTHGRA', 'Obra Social de la Unión de Trabajadores del Turismo, Hoteleros y Gastronómicos'),
  ('PAMI', 'PAMI', 'Programa de Atención Médica Integral'),
  ('OSPATCA', 'OSPATCA', 'Obra Social del Personal de la Actividad del Turf y Conexas de la Argentina'),
  ('OSPACP', 'OSPACP', 'Obra Social del Personal Auxiliar de Casas Particulares'),
  ('OSECAC', 'OSECAC', 'Obra Social de Empleados de Comercio y Actividades Civiles'),
  ('OSPJN', 'OSPJN', 'Obra Social del Poder Judicial de la Nación')
ON CONFLICT (name) DO NOTHING;