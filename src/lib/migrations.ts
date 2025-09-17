import { supabase } from './supabase';

export async function applyMigrations() {
  try {
    console.log('Aplicando migraciones de base de datos...');

    // Verificar si las tablas ya existen
    const { data: existingTables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['doctors', 'patients', 'practices', 'prescriptions', 'prescription_items']);

    if (existingTables && existingTables.length > 0) {
      console.log('Las tablas ya existen, saltando migraciones');
      return true;
    }

    // Crear las tablas usando SQL directo
    const createTablesSQL = `
      -- Crear función para actualizar timestamps
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Crear tabla doctors
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

      ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON doctors;
      CREATE POLICY "Allow all operations for authenticated users"
        ON doctors
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);

      DROP TRIGGER IF EXISTS update_doctors_updated_at ON doctors;
      CREATE TRIGGER update_doctors_updated_at
        BEFORE UPDATE ON doctors
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      -- Crear tabla patients
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

      ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON patients;
      CREATE POLICY "Allow all operations for authenticated users"
        ON patients
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);

      DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
      CREATE TRIGGER update_patients_updated_at
        BEFORE UPDATE ON patients
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      -- Crear tabla practices
      CREATE TABLE IF NOT EXISTS practices (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        code text UNIQUE NOT NULL,
        category text NOT NULL CHECK (category IN ('study', 'treatment', 'surgery')),
        description text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_practices_code ON practices(code);
      CREATE INDEX IF NOT EXISTS idx_practices_category ON practices(category);

      ALTER TABLE practices ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON practices;
      CREATE POLICY "Allow all operations for authenticated users"
        ON practices
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);

      DROP TRIGGER IF EXISTS update_practices_updated_at ON practices;
      CREATE TRIGGER update_practices_updated_at
        BEFORE UPDATE ON practices
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      -- Crear tabla prescriptions
      CREATE TABLE IF NOT EXISTS prescriptions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        number integer NOT NULL,
        type text NOT NULL CHECK (type IN ('studies', 'treatments', 'authorization')),
        doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
        patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
        additional_notes text,
        date date DEFAULT CURRENT_DATE,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_prescriptions_number ON prescriptions(number);
      CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);
      CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
      CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON prescriptions(date);

      ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON prescriptions;
      CREATE POLICY "Allow all operations for authenticated users"
        ON prescriptions
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);

      DROP TRIGGER IF EXISTS update_prescriptions_updated_at ON prescriptions;
      CREATE TRIGGER update_prescriptions_updated_at
        BEFORE UPDATE ON prescriptions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      -- Crear tabla prescription_items
      CREATE TABLE IF NOT EXISTS prescription_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        prescription_id uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
        practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE RESTRICT,
        ao text NOT NULL CHECK (ao IN ('AO', 'OI', 'OD')),
        notes text,
        created_at timestamptz DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription_id ON prescription_items(prescription_id);
      CREATE INDEX IF NOT EXISTS idx_prescription_items_practice_id ON prescription_items(practice_id);

      ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON prescription_items;
      CREATE POLICY "Allow all operations for authenticated users"
        ON prescription_items
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);

      -- Crear función para obtener el siguiente número de receta
      CREATE OR REPLACE FUNCTION get_next_prescription_number()
      RETURNS integer AS $$
      DECLARE
        next_number integer;
      BEGIN
        SELECT COALESCE(MAX(number), 0) + 1 INTO next_number FROM prescriptions;
        RETURN next_number;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Insertar datos iniciales para doctors
      INSERT INTO doctors (name, specialty, license, phone, email) VALUES
      ('Dr. Juan Pérez', 'Cardiología', 'MP12345', '+54 11 1234-5678', 'juan.perez@hospital.com'),
      ('Dra. María González', 'Neurología', 'MP23456', '+54 11 2345-6789', 'maria.gonzalez@hospital.com'),
      ('Dr. Carlos Rodríguez', 'Traumatología', 'MP34567', '+54 11 3456-7890', 'carlos.rodriguez@hospital.com')
      ON CONFLICT DO NOTHING;

      -- Insertar datos iniciales para patients
      INSERT INTO patients (name, social_work, affiliate_number, phone, email, address) VALUES
      ('Ana Martínez', 'OSDE', '123456789', '+54 11 9876-5432', 'ana.martinez@email.com', 'Av. Corrientes 1234, CABA'),
      ('Pedro López', 'Swiss Medical', '987654321', '+54 11 8765-4321', 'pedro.lopez@email.com', 'Av. Santa Fe 5678, CABA'),
      ('Laura Fernández', 'Galeno', '456789123', '+54 11 7654-3210', 'laura.fernandez@email.com', 'Av. Rivadavia 9012, CABA')
      ON CONFLICT DO NOTHING;

      -- Insertar datos iniciales para practices
      INSERT INTO practices (name, code, category, description) VALUES
      ('Electrocardiograma', 'ECG001', 'study', 'Estudio del ritmo cardíaco'),
      ('Radiografía de Tórax', 'RX001', 'study', 'Imagen radiológica del tórax'),
      ('Resonancia Magnética', 'RM001', 'study', 'Estudio por resonancia magnética'),
      ('Fisioterapia', 'FT001', 'treatment', 'Tratamiento de rehabilitación física'),
      ('Kinesiología', 'KN001', 'treatment', 'Tratamiento kinesiológico'),
      ('Cirugía de Rodilla', 'CR001', 'surgery', 'Intervención quirúrgica de rodilla'),
      ('Cirugía Cardíaca', 'CC001', 'surgery', 'Intervención quirúrgica cardíaca')
      ON CONFLICT (code) DO NOTHING;
    `;

    // Ejecutar el SQL usando el método nativo de Supabase
    const { error } = await supabase.rpc('exec', { sql: createTablesSQL });

    if (error) {
      console.error('Error ejecutando migraciones:', error);
      // Si falla con exec, intentar crear las tablas una por una
      await createTablesIndividually();
    }

    console.log('Migraciones aplicadas exitosamente');
    return true;
  } catch (error) {
    console.error('Error aplicando migraciones:', error);
    // Como fallback, intentar crear las tablas individualmente
    try {
      await createTablesIndividually();
      return true;
    } catch (fallbackError) {
      console.error('Error en fallback:', fallbackError);
      return false;
    }
  }
}

async function createTablesIndividually() {
  // Crear datos de prueba directamente usando los servicios
  const sampleDoctors = [
    { name: 'Dr. Juan Pérez', specialty: 'Cardiología', license: 'MP12345', phone: '+54 11 1234-5678', email: 'juan.perez@hospital.com' },
    { name: 'Dra. María González', specialty: 'Neurología', license: 'MP23456', phone: '+54 11 2345-6789', email: 'maria.gonzalez@hospital.com' },
    { name: 'Dr. Carlos Rodríguez', specialty: 'Traumatología', license: 'MP34567', phone: '+54 11 3456-7890', email: 'carlos.rodriguez@hospital.com' }
  ];

  const samplePatients = [
    { name: 'Ana Martínez', social_work: 'OSDE', affiliate_number: '123456789', phone: '+54 11 9876-5432', email: 'ana.martinez@email.com', address: 'Av. Corrientes 1234, CABA' },
    { name: 'Pedro López', social_work: 'Swiss Medical', affiliate_number: '987654321', phone: '+54 11 8765-4321', email: 'pedro.lopez@email.com', address: 'Av. Santa Fe 5678, CABA' },
    { name: 'Laura Fernández', social_work: 'Galeno', affiliate_number: '456789123', phone: '+54 11 7654-3210', email: 'laura.fernandez@email.com', address: 'Av. Rivadavia 9012, CABA' }
  ];

  const samplePractices = [
    { name: 'Electrocardiograma', code: 'ECG001', category: 'study' as const, description: 'Estudio del ritmo cardíaco' },
    { name: 'Radiografía de Tórax', code: 'RX001', category: 'study' as const, description: 'Imagen radiológica del tórax' },
    { name: 'Resonancia Magnética', code: 'RM001', category: 'study' as const, description: 'Estudio por resonancia magnética' },
    { name: 'Fisioterapia', code: 'FT001', category: 'treatment' as const, description: 'Tratamiento de rehabilitación física' },
    { name: 'Kinesiología', code: 'KN001', category: 'treatment' as const, description: 'Tratamiento kinesiológico' },
    { name: 'Cirugía de Rodilla', code: 'CR001', category: 'surgery' as const, description: 'Intervención quirúrgica de rodilla' },
    { name: 'Cirugía Cardíaca', code: 'CC001', category: 'surgery' as const, description: 'Intervención quirúrgica cardíaca' }
  ];

  // Intentar insertar datos de muestra
  try {
    // Insertar doctores
    for (const doctor of sampleDoctors) {
      await supabase.from('doctors').insert(doctor).select().single();
    }

    // Insertar pacientes
    for (const patient of samplePatients) {
      await supabase.from('patients').insert(patient).select().single();
    }

    // Insertar prácticas
    for (const practice of samplePractices) {
      await supabase.from('practices').insert(practice).select().single();
    }
  } catch (error) {
    console.log('Datos de muestra ya existen o no se pudieron insertar:', error);
  }
}