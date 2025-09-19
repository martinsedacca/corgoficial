import { supabase } from '../lib/supabase';
import { Doctor, Patient, Practice, Prescription, PrescriptionItem, SocialWork } from '../types';

// Servicios para Médicos
export const doctorService = {
  async getAll(): Promise<Doctor[]> {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async create(doctor: Omit<Doctor, 'id'>): Promise<Doctor> {
    const { data, error } = await supabase
      .from('doctors')
      .insert({
        name: doctor.name,
        specialty: doctor.specialty,
        license: doctor.license,
        phone: doctor.phone || null,
        email: doctor.email || null
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Doctor>): Promise<Doctor> {
    const { data, error } = await supabase
      .from('doctors')
      .update({
        name: updates.name,
        specialty: updates.specialty,
        license: updates.license,
        phone: updates.phone || null,
        email: updates.email || null
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('doctors')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Servicios para Pacientes
export const patientService = {
  async getAll(): Promise<Patient[]> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data.map(patient => ({
      id: patient.id,
      name: patient.name,
      socialWork: patient.social_work,
      affiliateNumber: patient.affiliate_number,
      plan: patient.plan || null,
      phone: patient.phone,
      email: patient.email,
      address: patient.address
    }));
  },

  async create(patient: Omit<Patient, 'id'>): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .insert({
        name: patient.name,
        social_work: patient.socialWork,
        affiliate_number: patient.affiliateNumber,
        plan: patient.plan || null,
        phone: patient.phone || null,
        email: patient.email || null,
        address: patient.address || null
      })
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      socialWork: data.social_work,
      affiliateNumber: data.affiliate_number,
      plan: data.plan || null,
      phone: data.phone,
      email: data.email,
      address: data.address
    };
  },

  async update(id: string, updates: Partial<Patient>): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .update({
        name: updates.name,
        social_work: updates.socialWork,
        affiliate_number: updates.affiliateNumber,
        plan: updates.plan || null,
        phone: updates.phone || null,
        email: updates.email || null,
        address: updates.address || null
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      socialWork: data.social_work,
      affiliateNumber: data.affiliate_number,
      plan: data.plan || null,
      phone: data.phone,
      email: data.email,
      address: data.address
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Servicios para Prácticas
export const practiceService = {
  async getAll(): Promise<Practice[]> {
    const { data, error } = await supabase
      .from('practices')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async create(practice: Omit<Practice, 'id'>): Promise<Practice> {
    const { data, error } = await supabase
      .from('practices')
      .insert({
        name: practice.name,
        code: practice.code,
        category: practice.category,
        description: practice.description || null
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Practice>): Promise<Practice> {
    const { data, error } = await supabase
      .from('practices')
      .update({
        name: updates.name,
        code: updates.code,
        category: updates.category,
        description: updates.description || null
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('practices')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Servicios para Recetas
export const prescriptionService = {
  async getAll(): Promise<Prescription[]> {
    const { data, error } = await supabase
      .from('prescriptions')
      .select(`
        *,
        doctor:doctors(*),
        patient:patients(*),
        prescription_items(
          *,
          practice:practices(*)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(prescription => ({
      id: prescription.id,
      number: prescription.number,
      type: prescription.type,
      doctorId: prescription.doctor_id,
      doctor: prescription.doctor,
      patientId: prescription.patient_id,
      patient: {
        id: prescription.patient.id,
        name: prescription.patient.name,
        socialWork: prescription.patient.social_work,
        affiliateNumber: prescription.patient.affiliate_number,
        plan: prescription.patient.plan,
        phone: prescription.patient.phone,
        email: prescription.patient.email,
        address: prescription.patient.address
      },
      items: prescription.prescription_items.map((item: any) => ({
        practiceId: item.practice_id,
        practice: item.practice,
        ao: item.ao,
        notes: item.notes
      })),
      additionalNotes: prescription.additional_notes,
      date: prescription.date,
      createdAt: prescription.created_at
    }));
  },

  async getNextNumber(): Promise<number> {
    const { data, error } = await supabase.rpc('get_next_prescription_number');
    if (error) throw error;
    return data;
  },

  async create(prescriptionData: Omit<Prescription, 'id' | 'number' | 'createdAt'>): Promise<Prescription> {
    // Obtener el siguiente número
    const number = await this.getNextNumber();
    
    // Crear la receta
    const { data: prescription, error: prescriptionError } = await supabase
      .from('prescriptions')
      .insert({
        number,
        type: prescriptionData.type,
        doctor_id: prescriptionData.doctorId,
        patient_id: prescriptionData.patientId,
        additional_notes: prescriptionData.additionalNotes || null,
        date: prescriptionData.date
      })
      .select()
      .single();
    
    if (prescriptionError) throw prescriptionError;
    
    // Crear los items de la receta
    if (prescriptionData.items.length > 0) {
      const { error: itemsError } = await supabase
        .from('prescription_items')
        .insert(
          prescriptionData.items.map(item => ({
            prescription_id: prescription.id,
            practice_id: item.practiceId,
            ao: item.ao || 'AO',
            notes: item.notes || null
          }))
        );
      
      if (itemsError) throw itemsError;
    }
    
    // Obtener la receta completa con relaciones
    const { data: fullPrescription, error: fetchError } = await supabase
      .from('prescriptions')
      .select(`
        *,
        doctor:doctors(*),
        patient:patients(*),
        prescription_items(
          *,
          practice:practices(*)
        )
      `)
      .eq('id', prescription.id)
      .single();
    
    if (fetchError) throw fetchError;
    
    return {
      id: fullPrescription.id,
      number: fullPrescription.number,
      type: fullPrescription.type,
      doctorId: fullPrescription.doctor_id,
      doctor: fullPrescription.doctor,
      patientId: fullPrescription.patient_id,
      patient: {
        id: fullPrescription.patient.id,
        name: fullPrescription.patient.name,
        socialWork: fullPrescription.patient.social_work,
        affiliateNumber: fullPrescription.patient.affiliate_number,
        phone: fullPrescription.patient.phone,
        email: fullPrescription.patient.email,
        address: fullPrescription.patient.address
      },
      items: fullPrescription.prescription_items.map((item: any) => ({
        practiceId: item.practice_id,
        practice: item.practice,
        ao: item.ao,
        notes: item.notes
      })),
      additionalNotes: fullPrescription.additional_notes,
      date: fullPrescription.date,
      createdAt: fullPrescription.created_at
    };
  },

  async update(id: string, updates: Partial<Prescription>): Promise<Prescription> {
    // Actualizar la receta principal
    const { data: prescription, error: prescriptionError } = await supabase
      .from('prescriptions')
      .update({
        type: updates.type,
        doctor_id: updates.doctorId,
        patient_id: updates.patientId,
        additional_notes: updates.additionalNotes || null,
        date: updates.date
      })
      .eq('id', id)
      .select()
      .single();
    
    if (prescriptionError) throw prescriptionError;
    
    // Si hay items para actualizar, eliminar los existentes y crear los nuevos
    if (updates.items) {
      // Eliminar items existentes
      const { error: deleteError } = await supabase
        .from('prescription_items')
        .delete()
        .eq('prescription_id', id);
      
      if (deleteError) throw deleteError;
      
      // Crear nuevos items
      if (updates.items.length > 0) {
        const { error: itemsError } = await supabase
          .from('prescription_items')
          .insert(
            updates.items.map(item => ({
              prescription_id: id,
              practice_id: item.practiceId,
              ao: item.ao || 'AO',
              notes: item.notes || null
            }))
          );
        
        if (itemsError) throw itemsError;
      }
    }
    
    // Obtener la receta completa actualizada
    const { data: fullPrescription, error: fetchError } = await supabase
      .from('prescriptions')
      .select(`
        *,
        doctor:doctors(*),
        patient:patients(*),
        prescription_items(
          *,
          practice:practices(*)
        )
      `)
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    return {
      id: fullPrescription.id,
      number: fullPrescription.number,
      type: fullPrescription.type,
      doctorId: fullPrescription.doctor_id,
      doctor: fullPrescription.doctor,
      patientId: fullPrescription.patient_id,
      patient: {
        id: fullPrescription.patient.id,
        name: fullPrescription.patient.name,
        socialWork: fullPrescription.patient.social_work,
        affiliateNumber: fullPrescription.patient.affiliate_number,
        phone: fullPrescription.patient.phone,
        email: fullPrescription.patient.email,
        address: fullPrescription.patient.address
      },
      items: fullPrescription.prescription_items.map((item: any) => ({
        practiceId: item.practice_id,
        practice: item.practice,
        ao: item.ao,
        notes: item.notes
      })),
      additionalNotes: fullPrescription.additional_notes,
      date: fullPrescription.date,
      createdAt: fullPrescription.created_at
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('prescriptions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Servicios para Obras Sociales
export const socialWorkService = {
  async getAll(): Promise<SocialWork[]> {
    const { data, error } = await supabase
      .from('social_works')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async create(socialWork: Omit<SocialWork, 'id'>): Promise<SocialWork> {
    const { data, error } = await supabase
      .from('social_works')
      .insert({
        name: socialWork.name,
        code: socialWork.code || null,
        description: socialWork.description || null
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<SocialWork>): Promise<SocialWork> {
    const { data, error } = await supabase
      .from('social_works')
      .update({
        name: updates.name,
        code: updates.code || null,
        description: updates.description || null
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('social_works')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};