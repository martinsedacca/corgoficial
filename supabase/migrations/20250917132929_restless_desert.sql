/*
  # Esquema inicial para el sistema de recetas médicas CORG

  1. Nuevas Tablas
    - `doctors` - Información de médicos
      - `id` (uuid, primary key)
      - `name` (text, nombre completo)
      - `specialty` (text, especialidad)
      - `license` (text, matrícula profesional)
      - `phone` (text, opcional)
      - `email` (text, opcional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `patients` - Información de pacientes
      - `id` (uuid, primary key)
      - `name` (text, nombre completo)
      - `social_work` (text, obra social)
      - `affiliate_number` (text, número de afiliado)
      - `phone` (text, opcional)
      - `email` (text, opcional)
      - `address` (text, opcional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `practices` - Catálogo de prácticas médicas
      - `id` (uuid, primary key)
      - `name` (text, nombre de la práctica)
      - `code` (text, código único)
      - `category` (text, categoría: study/treatment/surgery)
      - `description` (text, opcional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `prescriptions` - Recetas médicas
      - `id` (uuid, primary key)
      - `number` (integer, número secuencial)
      - `type` (text, tipo: studies/treatments/authorization)
      - `doctor_id` (uuid, foreign key)
      - `patient_id` (uuid, foreign key)
      - `additional_notes` (text, opcional)
      - `date` (date, fecha de la receta)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `prescription_items` - Items de cada receta
      - `id` (uuid, primary key)
      - `prescription_id` (uuid, foreign key)
      - `practice_id` (uuid, foreign key)
      - `ao` (text, AO/OI/OD)
      - `notes` (text, opcional)
      - `created_at` (timestamp)

  2. Seguridad
    - Habilitar RLS en todas las tablas
    - Políticas para usuarios autenticados
    - Índices para optimizar consultas

  3. Datos iniciales
    - Insertar prácticas médicas predefinidas
*/

-- Crear tabla de médicos
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialty text NOT NULL,
  license text NOT NULL,
  phone text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla de pacientes
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  social_work text NOT NULL,
  affiliate_number text NOT NULL,
  phone text,
  email text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla de prácticas
CREATE TABLE IF NOT EXISTS practices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  category text NOT NULL CHECK (category IN ('study', 'treatment', 'surgery')),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla de recetas
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number integer NOT NULL,
  type text NOT NULL CHECK (type IN ('studies', 'treatments', 'authorization')),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  additional_notes text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla de items de receta
CREATE TABLE IF NOT EXISTS prescription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE RESTRICT,
  ao text NOT NULL CHECK (ao IN ('AO', 'OI', 'OD')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON prescriptions(date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_number ON prescriptions(number);
CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription_id ON prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_practice_id ON prescription_items(practice_id);
CREATE INDEX IF NOT EXISTS idx_practices_category ON practices(category);
CREATE INDEX IF NOT EXISTS idx_practices_code ON practices(code);

-- Crear secuencia para números de receta
CREATE SEQUENCE IF NOT EXISTS prescription_number_seq START 1;

-- Función para obtener el siguiente número de receta
CREATE OR REPLACE FUNCTION get_next_prescription_number()
RETURNS integer AS $$
BEGIN
  RETURN nextval('prescription_number_seq');
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers a todas las tablas
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practices_updated_at BEFORE UPDATE ON practices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (permitir todo para usuarios autenticados por ahora)
CREATE POLICY "Allow all operations for authenticated users" ON doctors
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON patients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON practices
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON prescriptions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON prescription_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insertar datos iniciales de prácticas médicas
INSERT INTO practices (name, code, category, description) VALUES
-- Estudios
('Campo Visual Computarizado', 'CVC', 'study', 'Evaluación del campo visual'),
('Paquimetría', 'PAQ', 'study', 'Medición del grosor corneal'),
('Topografía Corneal Computada', 'TCC', 'study', 'Mapeo de la curvatura corneal'),
('OCT Macular', 'OCT-M', 'study', 'Tomografía de coherencia óptica macular'),
('OCT Cámara Anterior', 'OCT-CA', 'study', 'OCT de cámara anterior'),
('HRT (Tomografía Confocal de Retina)', 'HRT', 'study', 'Heidelberg Retina Tomograph'),
('Angio OCT', 'ANGIO', 'study', 'Angiografía OCT'),
('Retinografía Color', 'RET-C', 'study', 'Fotografía de retina a color'),
('Recuento Endotelial', 'RE', 'study', 'Conteo de células endoteliales'),
('Aberrometría', 'ABE', 'study', 'Medición de aberraciones oculares'),
('O.B.I.', 'OBI', 'study', 'Optical Biometry Interferometry'),
('Refractometría Computarizada', 'REF-C', 'study', 'Refractometría automatizada'),
('Screening Neonatal (0 a 3 años)', 'SCREEN', 'study', 'Tamizaje visual neonatal'),
('Test de Mirada Preferencial', 'TMP', 'study', 'Evaluación visual en niños'),
('Visión Cromática', 'VC', 'study', 'Test de visión de colores'),
('Gonioscopia con Lente de 3 o 4 Espejos', 'GONIO', 'study', 'Evaluación del ángulo iridocorneal'),
('Ecografía Oftalmológica', 'ECO', 'study', 'Ultrasonido ocular'),
('Poder Corneal Central', 'PCC', 'study', 'Medición de poder corneal central'),
('Meibografía', 'MEIBO', 'study', 'Evaluación de glándulas de Meibomio'),
('Ojo Seco Digital', 'OSD', 'study', 'Evaluación digital de ojo seco'),

-- Tratamientos
('SLT (Trabeculoplastia Láser Selectiva)', 'SLT', 'treatment', 'Trabeculoplastia láser selectiva'),
('YAG Láser (Capsulotomía)', 'YAG-CAP', 'treatment', 'Capsulotomía con láser YAG'),
('Iridotomía con YAG Láser', 'IRIDO-YAG', 'treatment', 'Iridotomía periférica con láser'),
('Fotocoagulación con Láser Argón', 'FOTO-ARG', 'treatment', 'Fotocoagulación retinal'),
('Iridoplastia con Láser Argón', 'IRIDO-ARG', 'treatment', 'Iridoplastia periférica'),
('Suturólisis con YAG Láser', 'SUT-YAG', 'treatment', 'Lisis de suturas con láser'),
('Exfoliación Glandular de Meibomio', 'EXF-MEIB', 'treatment', 'Tratamiento de glándulas de Meibomio'),

-- Cirugías
('Cirugía de Catarata', 'CAT', 'surgery', 'Facoemulsificación de catarata'),
('Extracción de Cristalino', 'EXT-CRIS', 'surgery', 'Extracción del cristalino')

ON CONFLICT (code) DO NOTHING;

-- Insertar médicos de ejemplo
INSERT INTO doctors (name, specialty, license, phone, email) VALUES
('Dr. Rodrigues Da Silva, Luiz', 'Oftalmología', 'M.P. 2552', '02966 431152', 'rodrigues@corg.com'),
('Dra. María González', 'Oftalmología', 'M.P. 1234', '02966 431153', 'gonzalez@corg.com'),
('Dr. Carlos Pérez', 'Retina', 'M.P. 5678', '02966 431154', 'perez@corg.com')
ON CONFLICT DO NOTHING;

-- Insertar pacientes de ejemplo
INSERT INTO patients (name, social_work, affiliate_number, phone, email, address) VALUES
('Juan Carlos Martínez', 'OSDE', '123456789', '2966 123456', 'juan.martinez@email.com', 'Av. Kirchner 456'),
('María Elena Fernández', 'Swiss Medical', '987654321', '2966 654321', 'maria.fernandez@email.com', 'Belgrano 789'),
('Roberto Silva', 'IOMA', '456789123', '2966 789456', 'roberto.silva@email.com', 'San Martín 321')
ON CONFLICT DO NOTHING;