import { supabase } from './supabase';

export async function applyMigrations() {
  try {
    console.log('Verificando y cargando datos iniciales...');

    // Verificar si ya existen datos en las tablas principales
    const { data: existingDoctors } = await supabase
      .from('doctors')
      .select('id')
      .limit(1);

    const { data: existingPatients } = await supabase
      .from('patients')
      .select('id')
      .limit(1);

    const { data: existingPractices } = await supabase
      .from('practices')
      .select('id')
      .limit(1);

    // Solo insertar datos si las tablas están vacías
    if (!existingDoctors || existingDoctors.length === 0) {
      await seedDoctors();
    }

    if (!existingPatients || existingPatients.length === 0) {
      await seedPatients();
    }

    if (!existingPractices || existingPractices.length === 0) {
      await seedPractices();
    }

    console.log('Datos iniciales cargados exitosamente');
    return true;
  } catch (error) {
    console.error('Error cargando datos iniciales:', error);
    // No fallar si no se pueden cargar los datos iniciales
    return true;
  }
}

async function seedDoctors() {
  const sampleDoctors = [
    { name: 'Dr. Juan Pérez', specialty: 'Cardiología', license: 'MP12345', phone: '+54 11 1234-5678', email: 'juan.perez@hospital.com' },
    { name: 'Dra. María González', specialty: 'Neurología', license: 'MP23456', phone: '+54 11 2345-6789', email: 'maria.gonzalez@hospital.com' },
    { name: 'Dr. Carlos Rodríguez', specialty: 'Traumatología', license: 'MP34567', phone: '+54 11 3456-7890', email: 'carlos.rodriguez@hospital.com' }
  ];

  for (const doctor of sampleDoctors) {
    try {
      await supabase
        .from('doctors')
        .upsert(doctor, { 
          onConflict: 'license',
          ignoreDuplicates: true 
        });
    } catch (error) {
      console.log('Doctor ya existe o error insertando:', error);
    }
  }
}

async function seedPatients() {
  const samplePatients = [
    { name: 'Ana Martínez', social_work: 'OSDE', affiliate_number: '123456789', phone: '+54 11 9876-5432', email: 'ana.martinez@email.com', address: 'Av. Corrientes 1234, CABA' },
    { name: 'Pedro López', social_work: 'Swiss Medical', affiliate_number: '987654321', phone: '+54 11 8765-4321', email: 'pedro.lopez@email.com', address: 'Av. Santa Fe 5678, CABA' },
    { name: 'Laura Fernández', social_work: 'Galeno', affiliate_number: '456789123', phone: '+54 11 7654-3210', email: 'laura.fernandez@email.com', address: 'Av. Rivadavia 9012, CABA' }
  ];

  for (const patient of samplePatients) {
    try {
      await supabase
        .from('patients')
        .upsert(patient, { 
          onConflict: 'affiliate_number',
          ignoreDuplicates: true 
        });
    } catch (error) {
      console.log('Paciente ya existe o error insertando:', error);
    }
  }
}

async function seedPractices() {
  const samplePractices = [
    { name: 'Electrocardiograma', code: 'ECG001', category: 'study' as const, description: 'Estudio del ritmo cardíaco' },
    { name: 'Radiografía de Tórax', code: 'RX001', category: 'study' as const, description: 'Imagen radiológica del tórax' },
    { name: 'Resonancia Magnética', code: 'RM001', category: 'study' as const, description: 'Estudio por resonancia magnética' },
    { name: 'Fisioterapia', code: 'FT001', category: 'treatment' as const, description: 'Tratamiento de rehabilitación física' },
    { name: 'Kinesiología', code: 'KN001', category: 'treatment' as const, description: 'Tratamiento kinesiológico' },
    { name: 'Cirugía de Rodilla', code: 'CR001', category: 'surgery' as const, description: 'Intervención quirúrgica de rodilla' },
    { name: 'Cirugía Cardíaca', code: 'CC001', category: 'surgery' as const, description: 'Intervención quirúrgica cardíaca' }
  ];

  for (const practice of samplePractices) {
    try {
      await supabase
        .from('practices')
        .upsert(practice, { 
          onConflict: 'code',
          ignoreDuplicates: true 
        });
    } catch (error) {
      console.log('Práctica ya existe o error insertando:', error);
    }
  }
}