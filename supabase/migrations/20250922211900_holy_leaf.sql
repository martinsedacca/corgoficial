/*
  # Agregar sistema de planes de obras sociales

  1. New Tables
    - `social_work_plans`
      - `id` (uuid, primary key)
      - `social_work_id` (uuid, foreign key to social_works)
      - `name` (text, nombre del plan)
      - `code` (text, código del plan, opcional)
      - `description` (text, descripción, opcional)
      - `is_active` (boolean, si el plan está activo)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `social_work_plans` table
    - Add policies for authenticated users to read plans
    - Add policies for admin/secretary to manage plans

  3. Changes
    - Add indexes for better performance
    - Add trigger for updated_at
    - Populate with existing data from CSV
*/

-- Create social_work_plans table
CREATE TABLE IF NOT EXISTS social_work_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  social_work_id uuid NOT NULL REFERENCES social_works(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_social_work_plans_social_work_id ON social_work_plans(social_work_id);
CREATE INDEX IF NOT EXISTS idx_social_work_plans_active ON social_work_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_social_work_plans_name ON social_work_plans(name);

-- Enable RLS
ALTER TABLE social_work_plans ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "All authenticated users can view social work plans"
  ON social_work_plans
  FOR SELECT
  TO authenticated
  USING (is_user_active());

CREATE POLICY "Admin and secretary can create social work plans"
  ON social_work_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = ANY (ARRAY['admin'::text, 'secretary'::text]));

CREATE POLICY "Admin and secretary can update social work plans"
  ON social_work_plans
  FOR UPDATE
  TO authenticated
  USING (get_user_role() = ANY (ARRAY['admin'::text, 'secretary'::text]))
  WITH CHECK (get_user_role() = ANY (ARRAY['admin'::text, 'secretary'::text]));

CREATE POLICY "Admin and secretary can delete social work plans"
  ON social_work_plans
  FOR DELETE
  TO authenticated
  USING (get_user_role() = ANY (ARRAY['admin'::text, 'secretary'::text]));

-- Add trigger for updated_at
CREATE TRIGGER update_social_work_plans_updated_at
  BEFORE UPDATE ON social_work_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert social works and their plans based on the CSV data
DO $$
DECLARE
  social_work_record RECORD;
  plan_name TEXT;
BEGIN
  -- CSS
  INSERT INTO social_works (name, code) VALUES ('CSS', 'CSS') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'CSS';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- OSDE
  INSERT INTO social_works (name, code) VALUES ('OSDE', 'OSDE') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'OSDE';
  FOR plan_name IN SELECT unnest(ARRAY['210', '310', '410', '450', '510']) LOOP
    INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, plan_name);
  END LOOP;

  -- PAMI
  INSERT INTO social_works (name, code) VALUES ('PAMI', 'PAMI') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'PAMI';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- Particular
  INSERT INTO social_works (name, code) VALUES ('Particular', 'PARTICULAR') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'Particular';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Sin plan');

  -- Camioneros
  INSERT INTO social_works (name, code) VALUES ('Camioneros', 'CAMIONEROS') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'Camioneros';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- ADMED-OSFGPICYD (Clínica del Valle)
  INSERT INTO social_works (name, code) VALUES ('ADMED-OSFGPICYD (Clínica del Valle)', 'ADMED') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'ADMED-OSFGPICYD (Clínica del Valle)';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- OSUTHGRA (Clínica del Valle)
  INSERT INTO social_works (name, code) VALUES ('OSUTHGRA (Clínica del Valle)', 'OSUTHGRA') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'OSUTHGRA (Clínica del Valle)';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- UNO SALUD (Clínica del Valle)
  INSERT INTO social_works (name, code) VALUES ('UNO SALUD (Clínica del Valle)', 'UNO_SALUD') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'UNO SALUD (Clínica del Valle)';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- OMINT
  INSERT INTO social_works (name, code) VALUES ('OMINT', 'OMINT') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'OMINT';
  FOR plan_name IN SELECT unnest(ARRAY['1500', '2500', '2600', '4021', '4500', '6500', '8500', 'O', 'F', 'C4']) LOOP
    INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, plan_name);
  END LOOP;

  -- OSTEL
  INSERT INTO social_works (name, code) VALUES ('OSTEL', 'OSTEL') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'OSTEL';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- OSMATA (SUMA)
  INSERT INTO social_works (name, code) VALUES ('OSMATA (SUMA)', 'OSMATA') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'OSMATA (SUMA)';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- OSPe
  INSERT INTO social_works (name, code) VALUES ('OSPe', 'OSPE') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'OSPe';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Jóvenes Estudiantes');

  -- Unión Personal
  INSERT INTO social_works (name, code) VALUES ('Unión Personal', 'UNION_PERSONAL') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'Unión Personal';
  FOR plan_name IN SELECT unnest(ARRAY['Classic', 'Familiar']) LOOP
    INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, plan_name);
  END LOOP;

  -- Colegio Médico (SUMA)
  INSERT INTO social_works (name, code) VALUES ('Colegio Médico (SUMA)', 'COLEGIO_MEDICO') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'Colegio Médico (SUMA)';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- DASUTEN
  INSERT INTO social_works (name, code) VALUES ('DASUTEN', 'DASUTEN') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'DASUTEN';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- Galeno
  INSERT INTO social_works (name, code) VALUES ('Galeno', 'GALENO') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'Galeno';
  FOR plan_name IN SELECT unnest(ARRAY['220', '330', '440', '550', 'Oro', 'Plata']) LOOP
    INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, plan_name);
  END LOOP;

  -- I-Salud
  INSERT INTO social_works (name, code) VALUES ('I-Salud', 'I_SALUD') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'I-Salud';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- MEDICUS
  INSERT INTO social_works (name, code) VALUES ('MEDICUS', 'MEDICUS') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'MEDICUS';
  FOR plan_name IN SELECT unnest(ARRAY['Centros Medicus', 'MC/Integra', 'Family Care/ONE', 'Celeste', 'Azul']) LOOP
    INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, plan_name);
  END LOOP;

  -- Continue with remaining social works...
  -- OSPF
  INSERT INTO social_works (name, code) VALUES ('OSPF', 'OSPF') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'OSPF';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- OSDEPYM
  INSERT INTO social_works (name, code) VALUES ('OSDEPYM', 'OSDEPYM') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'OSDEPYM';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- OSDIPP
  INSERT INTO social_works (name, code) VALUES ('OSDIPP', 'OSDIPP') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'OSDIPP';
  FOR plan_name IN SELECT unnest(ARRAY['1D', '2D', '3E']) LOOP
    INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, plan_name);
  END LOOP;

  -- OSSALARA
  INSERT INTO social_works (name, code) VALUES ('OSSALARA', 'OSSALARA') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'OSSALARA';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- OSPEDYC
  INSERT INTO social_works (name, code) VALUES ('OSPEDYC', 'OSPEDYC') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'OSPEDYC';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- OSPSA
  INSERT INTO social_works (name, code) VALUES ('OSPSA', 'OSPSA') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'OSPSA';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- OSYC
  INSERT INTO social_works (name, code) VALUES ('OSYC', 'OSYC') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'OSYC';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- OSPEGAP
  INSERT INTO social_works (name, code) VALUES ('OSPEGAP', 'OSPEGAP') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'OSPEGAP';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- Poder Judicial
  INSERT INTO social_works (name, code) VALUES ('Poder Judicial', 'PODER_JUDICIAL') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'Poder Judicial';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- Policía Federal
  INSERT INTO social_works (name, code) VALUES ('Policía Federal', 'POLICIA_FEDERAL') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'Policía Federal';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- Sancor Salud
  INSERT INTO social_works (name, code) VALUES ('Sancor Salud', 'SANCOR') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'Sancor Salud';
  FOR plan_name IN SELECT unnest(ARRAY[
    'SANCOR 500', 'SANCOR 500 Tucumán', 'SANCOR 1000', 'SANCOR 1500', 'SANCOR 2000', 
    'SANCOR 3000', 'SANCOR 3500', 'SANCOR 4000', 'SANCOR 4500', '5000 Exclusive', 
    '6000 Exclusive', 'Plan C Platino Tucumán', 'Plan C Plus Tucumán', 'C Tucumán'
  ]) LOOP
    INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, plan_name);
  END LOOP;

  -- Swiss Medical
  INSERT INTO social_works (name, code) VALUES ('Swiss Medical', 'SWISS') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'Swiss Medical';
  FOR plan_name IN SELECT unnest(ARRAY[
    'SMG01', 'SMG02', 'SMG10', 'SMG20', 'SMG30', 'SMG40', 'SMG50', 'SMG60', 'SMG70', 'Black80', 'Black90'
  ]) LOOP
    INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, plan_name);
  END LOOP;

  -- OSPTV
  INSERT INTO social_works (name, code) VALUES ('OSPTV', 'OSPTV') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'OSPTV';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'TV Salud – Todos los planes');

  -- OSDEPYME
  INSERT INTO social_works (name, code) VALUES ('OSDEPYME', 'OSDEPYME') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'OSDEPYME';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- Medife
  INSERT INTO social_works (name, code) VALUES ('Medife', 'MEDIFE') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'Medife';
  FOR plan_name IN SELECT unnest(ARRAY['Bronce', 'Juntos', 'Plata', 'Oro', 'Platinum']) LOOP
    INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, plan_name);
  END LOOP;

  -- AMPJBON
  INSERT INTO social_works (name, code) VALUES ('AMPJBON', 'AMPJBON') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'AMPJBON';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- OSCTCP-UTA
  INSERT INTO social_works (name, code) VALUES ('OSCTCP-UTA', 'OSCTCP_UTA') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'OSCTCP-UTA';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- Mutual del Clero
  INSERT INTO social_works (name, code) VALUES ('Mutual del Clero', 'MUTUAL_CLERO') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'Mutual del Clero';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- FATFA
  INSERT INTO social_works (name, code) VALUES ('FATFA', 'FATFA') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'FATFA';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- OSPTA
  INSERT INTO social_works (name, code) VALUES ('OSPTA', 'OSPTA') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'OSPTA';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- UTEPLIM
  INSERT INTO social_works (name, code) VALUES ('UTEPLIM', 'UTEPLIM') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'UTEPLIM';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- OSDOP
  INSERT INTO social_works (name, code) VALUES ('OSDOP', 'OSDOP') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'OSDOP';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- OSPACARP
  INSERT INTO social_works (name, code) VALUES ('OSPACARP', 'OSPACARP') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'OSPACARP';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- Konke Hotel
  INSERT INTO social_works (name, code) VALUES ('Konke Hotel', 'KONKE_HOTEL') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'Konke Hotel';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- Mutual Motociclistas
  INSERT INTO social_works (name, code) VALUES ('Mutual Motociclistas', 'MUTUAL_MOTOCICLISTAS') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'Mutual Motociclistas';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- OSTPCHPYARA
  INSERT INTO social_works (name, code) VALUES ('OSTPCHPYARA', 'OSTPCHPYARA') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'OSTPCHPYARA';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- La Segunda ART
  INSERT INTO social_works (name, code) VALUES ('La Segunda ART', 'LA_SEGUNDA_ART') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'La Segunda ART';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- IOSFA
  INSERT INTO social_works (name, code) VALUES ('IOSFA', 'IOSFA') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'IOSFA';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

  -- Servicio Penitenciario
  INSERT INTO social_works (name, code) VALUES ('Servicio Penitenciario', 'SERVICIO_PENITENCIARIO') ON CONFLICT (name) DO NOTHING;
  SELECT id INTO social_work_record FROM social_works WHERE name = 'Servicio Penitenciario';
  INSERT INTO social_work_plans (social_work_id, name) VALUES (social_work_record.id, 'Todos los planes');

END $$;