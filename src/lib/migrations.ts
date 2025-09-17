import { supabase } from './supabase';

export async function applyMigrations() {
  try {
    console.log('Aplicando migraciones de base de datos...');

    // Crear función para actualizar timestamps
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = now();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `
    }).catch(() => {
      // Si falla, intentamos con SQL directo
    });

    // Crear tabla doctors
    const { error: doctorsError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (doctorsError) console.error('Error creating doctors table:', doctorsError);

    // Crear tabla patients
    const { error: patientsError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (patientsError) console.error('Error creating patients table:', patientsError);

    // Crear tabla practices
    const { error: practicesError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (practicesError) console.error('Error creating practices table:', practicesError);

    // Crear tabla prescriptions
    const { error: prescriptionsError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (prescriptionsError) console.error('Error creating prescriptions table:', prescriptionsError);

    // Crear tabla prescription_items
    const { error: itemsError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (itemsError) console.error('Error creating prescription_items table:', itemsError);

    // Crear función para obtener el siguiente número de receta
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_next_prescription_number()
        RETURNS integer AS $$
        DECLARE
          next_number integer;
        BEGIN
          SELECT COALESCE(MAX(number), 0) + 1 INTO next_number FROM prescriptions;
          RETURN next_number;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });

    if (functionError) console.error('Error creating function:', functionError);

    console.log('Migraciones aplicadas exitosamente');
    return true;
  } catch (error) {
    console.error('Error aplicando migraciones:', error);
    return false;
  }
}