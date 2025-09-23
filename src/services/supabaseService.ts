import { supabase } from '../lib/supabase';
import { Doctor, Patient, Practice, Prescription, PrescriptionItem, SocialWork, SocialWorkPlan } from '../types';

// Servicios para Médicos
export const doctorService = {
  async getAll(): Promise<Doctor[]> {
    try {
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.warn('Supabase not configured, returning empty doctors array');
        return [];
      }

      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching doctors:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Network error fetching doctors:', error);
      return [];
    }
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
  async getAll(page: number = 1, pageSize: number = 100): Promise<{ patients: Patient[]; totalCount: number; hasMore: boolean }> {
    try {
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.warn('Supabase not configured, returning empty patients array');
        return { patients: [], totalCount: 0, hasMore: false };
      }

      // Calcular offset para la paginación
      const offset = (page - 1) * pageSize;

      // Obtener el total de registros
      const { count, error: countError } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error fetching patients count:', countError);
        return { patients: [], totalCount: 0, hasMore: false };
      }

      const totalCount = count || 0;

      // Obtener los pacientes paginados
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .range(offset, offset + pageSize - 1)
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching patients:', error);
        return { patients: [], totalCount: 0, hasMore: false };
      }
      
      const patients = data.map(patient => ({
        id: patient.id,
        name: patient.name,
        lastName: patient.last_name || '',
        dni: patient.dni,
        socialWork: patient.social_work,
        affiliateNumber: patient.affiliate_number || '',
        plan: patient.plan || '',
        phone: patient.phone,
        email: patient.email,
        address: patient.address
      }));

      const hasMore = offset + pageSize < totalCount;

      return { patients, totalCount, hasMore };
    } catch (error) {
      console.error('Network error fetching patients:', error);
      return { patients: [], totalCount: 0, hasMore: false };
    }
  },

  async search(searchTerm: string, filters: {
    name?: string;
    dni?: string;
    socialWork?: string;
    affiliateNumber?: string;
  } = {}, page: number = 1, pageSize: number = 100): Promise<{ patients: Patient[]; totalCount: number; hasMore: boolean }> {
    try {
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.warn('Supabase not configured, returning empty patients array');
        return { patients: [], totalCount: 0, hasMore: false };
      }

      const offset = (page - 1) * pageSize;
      let query = supabase.from('patients').select('*', { count: 'exact' });

      // Aplicar filtros de búsqueda
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase().trim();
        const words = searchTermLower.split(/\s+/).filter(word => word.length > 0);
        
        if (words.length > 0) {
          // Para cada palabra, crear una condición OR que busque en todos los campos
          const wordConditions = words.map(word => 
            `or(name.ilike.%${word}%,last_name.ilike.%${word}%,dni.ilike.%${word}%)`
          );
          
          // Si hay múltiples palabras, usar AND para combinar las condiciones
          if (wordConditions.length === 1) {
            query = query.or(wordConditions[0].replace('or(', '').replace(')', ''));
          } else {
            query = query.filter('and', `(${wordConditions.join(',')})`);
          }
        }
      }

      if (filters.name) {
        const nameLower = filters.name.toLowerCase().trim();
        const nameWords = nameLower.split(/\s+/).filter(word => word.length > 0);
        
        if (nameWords.length > 0) {
          const nameConditions = nameWords.map(word => 
            `or(name.ilike.%${word}%,last_name.ilike.%${word}%)`
          );
          
          if (nameConditions.length === 1) {
            query = query.or(nameConditions[0].replace('or(', '').replace(')', ''));
          } else {
            query = query.filter('and', `(${nameConditions.join(',')})`);
          }
        }
      }

      if (filters.dni) {
        const dniLower = filters.dni.toLowerCase();
        query = query.ilike('dni', `%${dniLower}%`);
      }

      if (filters.socialWork) {
        const socialWorkLower = filters.socialWork.toLowerCase();
        query = query.ilike('social_work', `%${socialWorkLower}%`);
      }

      if (filters.affiliateNumber) {
        const affiliateNumberLower = filters.affiliateNumber.toLowerCase();
        query = query.ilike('affiliate_number', `%${affiliateNumberLower}%`);
      }

      // Obtener total con filtros
      const { count, error: countError } = await query;
      
      if (countError) {
        console.error('Error fetching filtered patients count:', countError);
        return { patients: [], totalCount: 0, hasMore: false };
      }

      const totalCount = count || 0;

      // Obtener datos paginados
      const { data, error } = await query
        .range(offset, offset + pageSize - 1)
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching filtered patients:', error);
        return { patients: [], totalCount: 0, hasMore: false };
      }
      
      const patients = data.map(patient => ({
        id: patient.id,
        name: patient.name,
        lastName: patient.last_name || '',
        dni: patient.dni,
        socialWork: patient.social_work,
        affiliateNumber: patient.affiliate_number || '',
        plan: patient.plan || '',
        phone: patient.phone,
        email: patient.email,
        address: patient.address
      }));

      const hasMore = offset + pageSize < totalCount;

      return { patients, totalCount, hasMore };
    } catch (error) {
      console.error('Network error searching patients:', error);
      return { patients: [], totalCount: 0, hasMore: false };
    }
  },

  async searchForAutocomplete(searchTerm: string, limit: number = 50): Promise<Patient[]> {
    try {
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.warn('Supabase not configured, returning empty patients array');
        return [];
      }

      // Búsqueda específica para autocomplete con límite reducido
      const searchTermLower = searchTerm.toLowerCase().trim();
      const words = searchTermLower.split(/\s+/).filter(word => word.length > 0);
      
      let query = supabase.from('patients').select('*');
      
      if (words.length === 1) {
        // Búsqueda de una sola palabra
        const word = words[0];
        query = query.or(`name.ilike.%${word}%,last_name.ilike.%${word}%,dni.ilike.%${word}%,social_work.ilike.%${word}%,affiliate_number.ilike.%${word}%`);
      } else if (words.length > 1) {
        // Búsqueda de múltiples palabras - cada palabra debe aparecer en algún campo
        const wordConditions = words.map(word => 
          `or(name.ilike.%${word}%,last_name.ilike.%${word}%,dni.ilike.%${word}%,social_work.ilike.%${word}%,affiliate_number.ilike.%${word}%)`
        );
        query = query.filter('and', `(${wordConditions.join(',')})`);
      }
      
      const { data, error } = await query
        .order('name', { ascending: true })
        .limit(limit);
      
      if (error) {
        console.error('Error searching patients for autocomplete:', error);
        return [];
      }
      
      return data.map(patient => ({
        id: patient.id,
        name: patient.name,
        lastName: patient.last_name || '',
        dni: patient.dni,
        socialWork: patient.social_work,
        affiliateNumber: patient.affiliate_number || '',
        plan: patient.plan || '',
        phone: patient.phone,
        email: patient.email,
        address: patient.address
      }));
    } catch (error) {
      console.error('Network error searching patients for autocomplete:', error);
      return [];
    }
  },

  async create(patient: Omit<Patient, 'id'>): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .insert({
        name: patient.name,
        last_name: patient.lastName,
        dni: patient.dni,
        social_work: patient.socialWork,
        affiliate_number: patient.affiliateNumber || null,
        plan: patient.plan || null,
        phone: patient.phone || null,
        email: patient.email || null,
        address: patient.address || null
      })
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to create patient - no data returned');
    return {
      id: data.id,
      name: data.name,
      lastName: data.last_name || '',
      dni: data.dni,
      socialWork: data.social_work,
      affiliateNumber: data.affiliate_number || '',
      plan: data.plan || '',
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
        last_name: updates.lastName,
        dni: updates.dni,
        social_work: updates.socialWork,
        affiliate_number: updates.affiliateNumber || null,
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
      lastName: data.last_name,
      dni: data.dni,
      socialWork: data.social_work,
      affiliateNumber: data.affiliate_number || '',
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
    try {
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.warn('Supabase not configured, returning empty practices array');
        return [];
      }

      const { data, error } = await supabase
        .from('practices')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) {
        if (error.message?.includes('Failed to fetch') || error.message?.includes('Supabase not configured')) {
          console.warn('Supabase connection failed, returning empty practices array');
          return [];
        }
        console.error('Error fetching practices:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('Network error fetching practices, returning empty array');
        return [];
      }
      console.error('Network error fetching practices:', error);
      return [];
    }
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
    try {
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.warn('Supabase not configured, returning empty prescriptions array');
        return [];
      }

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
      
      if (error) {
        if (error.message?.includes('Failed to fetch') || error.message?.includes('Supabase not configured')) {
          console.warn('Supabase connection failed, returning empty prescriptions array');
          return [];
        }
        console.error('Error fetching prescriptions:', error);
        return [];
      }
      
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
          lastName: prescription.patient.last_name || '',
          dni: prescription.patient.dni,
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
        createdAt: prescription.created_at,
        createdBy: prescription.created_by,
        authorized: prescription.authorized
      }));
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('Network error fetching prescriptions, returning empty array');
        return [];
      }
      console.error('Network error fetching prescriptions:', error);
      return [];
    }
  },

  async getNextNumber(): Promise<number> {
    const { data, error } = await supabase.rpc('get_next_prescription_number');
    if (error) throw error;
    return data;
  },

  async create(prescriptionData: Omit<Prescription, 'id' | 'number' | 'createdAt'>): Promise<Prescription> {
    // Obtener el siguiente número
    const number = await this.getNextNumber();
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');
    
    // Crear la receta
    const { data: prescription, error: prescriptionError } = await supabase
      .from('prescriptions')
      .insert({
        number,
        type: prescriptionData.type,
        doctor_id: prescriptionData.doctorId,
        patient_id: prescriptionData.patientId,
        additional_notes: prescriptionData.additionalNotes || null,
        date: prescriptionData.date,
        authorized: false,
        created_by: user.id
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
        lastName: fullPrescription.patient.last_name || '',
        dni: fullPrescription.patient.dni,
        socialWork: fullPrescription.patient.social_work,
        affiliateNumber: fullPrescription.patient.affiliate_number,
        plan: fullPrescription.patient.plan,
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
      createdAt: fullPrescription.created_at,
      createdBy: fullPrescription.created_by,
      authorized: fullPrescription.authorized
    };
  },

  async update(id: string, updates: Partial<Prescription>): Promise<Prescription> {
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');
    
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
        lastName: fullPrescription.patient.last_name || '',
        dni: fullPrescription.patient.dni,
        socialWork: fullPrescription.patient.social_work,
        affiliateNumber: fullPrescription.patient.affiliate_number,
        plan: fullPrescription.patient.plan,
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
      createdAt: fullPrescription.created_at,
      createdBy: fullPrescription.created_by,
      authorized: fullPrescription.authorized
    };
  },

  async updateAuthorization(id: string, authorized: boolean): Promise<void> {
    const { error } = await supabase
      .from('prescriptions')
      .update({ authorized })
      .eq('id', id);
    
    if (error) throw error;
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
    try {
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.warn('Supabase not configured, returning empty social works array');
        return [];
      }

      const { data, error } = await supabase
        .from('social_works')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching social works:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Network error fetching social works:', error);
      return [];
    }
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

// Servicios para Planes de Obras Sociales
export const socialWorkPlanService = {
  async getAll(): Promise<SocialWorkPlan[]> {
    try {
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.warn('Supabase not configured, returning empty social work plans array');
        return [];
      }

      const { data, error } = await supabase
        .from('social_work_plans')
        .select(`
          *,
          social_work:social_works(name)
        `)
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching social work plans:', error);
        return [];
      }
      
      console.log('Raw social work plans data from DB:', data);
      
      return data.map(plan => ({
        id: plan.id,
        socialWorkId: plan.social_work_id,
        name: plan.name,
        code: plan.code,
        description: plan.description,
        isActive: plan.is_active,
        socialWorkName: plan.social_work?.name
      }));
    } catch (error) {
      console.error('Network error fetching social work plans:', error);
      return [];
    }
  },

  async getBySocialWork(socialWorkId: string): Promise<SocialWorkPlan[]> {
    try {
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.warn('Supabase not configured, returning empty social work plans array');
        return [];
      }

      const { data, error } = await supabase
        .from('social_work_plans')
        .select('*')
        .eq('social_work_id', socialWorkId)
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching social work plans by social work:', error);
        return [];
      }
      
      return data.map(plan => ({
        id: plan.id,
        socialWorkId: plan.social_work_id,
        name: plan.name,
        code: plan.code,
        description: plan.description,
        isActive: plan.is_active
      }));
    } catch (error) {
      console.error('Network error fetching social work plans by social work:', error);
      return [];
    }
  },

  async create(plan: Omit<SocialWorkPlan, 'id'>): Promise<SocialWorkPlan> {
    const { data, error } = await supabase
      .from('social_work_plans')
      .insert({
        social_work_id: plan.socialWorkId,
        name: plan.name,
        code: plan.code || null,
        description: plan.description || null,
        is_active: plan.isActive
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      socialWorkId: data.social_work_id,
      name: data.name,
      code: data.code,
      description: data.description,
      isActive: data.is_active
    };
  },

  async update(id: string, updates: Partial<SocialWorkPlan>): Promise<SocialWorkPlan> {
    const { data, error } = await supabase
      .from('social_work_plans')
      .update({
        social_work_id: updates.socialWorkId,
        name: updates.name,
        code: updates.code || null,
        description: updates.description || null,
        is_active: updates.isActive
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      socialWorkId: data.social_work_id,
      name: data.name,
      code: data.code,
      description: data.description,
      isActive: data.is_active
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('social_work_plans')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};