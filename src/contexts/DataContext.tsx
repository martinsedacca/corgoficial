import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { Doctor, Patient, Practice, Prescription, SocialWork } from '../types';
import { doctorService, patientService, practiceService, prescriptionService, socialWorkService } from '../services/supabaseService';

interface DataContextType {
  doctors: Doctor[];
  patients: Patient[];
  patientsMetadata: {
    totalCount: number;
    currentPage: number;
    pageSize: number;
    hasMore: boolean;
  };
  practices: Practice[];
  prescriptions: Prescription[];
  socialWorks: SocialWork[];
  socialWorkPlans: SocialWorkPlan[];
  loadingDoctors: boolean;
  loadingPatients: boolean;
  loadingPractices: boolean;
  loadingPrescriptions: boolean;
  loadingSocialWorks: boolean;
  loadingSocialWorkPlans: boolean;
  loadDoctors: () => Promise<void>;
  loadPatients: (page?: number, reset?: boolean) => Promise<void>;
  searchPatients: (searchTerm: string, filters?: any, page?: number, reset?: boolean) => Promise<void>;
  loadPractices: () => Promise<void>;
  loadPrescriptions: () => Promise<void>;
  loadSocialWorks: () => Promise<void>;
  loadSocialWorkPlans: () => Promise<void>;
  getSocialWorkPlans: (socialWorkId: string) => SocialWorkPlan[];
  addDoctor: (doctor: Omit<Doctor, 'id'>) => Promise<void>;
  updateDoctor: (id: string, doctor: Partial<Doctor>) => Promise<void>;
  deleteDoctor: (id: string) => Promise<void>;
  addPatient: (patient: Omit<Patient, 'id'>) => Promise<Patient>;
  updatePatient: (id: string, patient: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  searchPatientsForAutocomplete: (searchTerm: string) => Promise<Patient[]>;
  addPractice: (practice: Omit<Practice, 'id'>) => Promise<void>;
  updatePractice: (id: string, practice: Partial<Practice>) => Promise<void>;
  deletePractice: (id: string) => Promise<void>;
  addPrescription: (prescription: Omit<Prescription, 'id' | 'number' | 'createdAt'>) => Promise<void>;
  updatePrescription: (id: string, prescription: Partial<Prescription>) => Promise<void>;
  deletePrescription: (id: string) => Promise<void>;
  addSocialWork: (socialWork: Omit<SocialWork, 'id'>) => Promise<void>;
  updateSocialWork: (id: string, socialWork: Partial<SocialWork>) => Promise<void>;
  deleteSocialWork: (id: string) => Promise<void>;
  addSocialWorkPlan: (plan: Omit<SocialWorkPlan, 'id'>) => Promise<void>;
  updateSocialWorkPlan: (id: string, plan: Partial<SocialWorkPlan>) => Promise<void>;
  deleteSocialWorkPlan: (id: string) => Promise<void>;
  getNextPrescriptionNumber: () => Promise<number>;
  updatePrescriptionAuthorization: (id: string, authorized: boolean) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsMetadata, setPatientsMetadata] = useState({
    totalCount: 0,
    currentPage: 1,
    pageSize: 100,
    hasMore: false
  });
  const [practices, setPractices] = useState<Practice[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [socialWorks, setSocialWorks] = useState<SocialWork[]>([]);
  const [socialWorkPlans, setSocialWorkPlans] = useState<SocialWorkPlan[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingPractices, setLoadingPractices] = useState(false);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [loadingSocialWorks, setLoadingSocialWorks] = useState(false);
  const [loadingSocialWorkPlans, setLoadingSocialWorkPlans] = useState(false);

  // Create refs to hold current loading states for stable function references
  const loadingPrescriptionsRef = useRef(loadingPrescriptions);
  
  // Update refs when state changes
  useEffect(() => {
    loadingPrescriptionsRef.current = loadingPrescriptions;
  }, [loadingPrescriptions]);

  // Configurar suscripciones en tiempo real
  useEffect(() => {
    const setupSubscriptions = async () => {
      // Solo configurar suscripciones automáticas para médicos (sus propias recetas)
      // Los administradores y secretarias usan el sistema de notificaciones
      if (!user) return;

      // Para médicos: suscripción automática solo a sus propias recetas
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      // Obtener el perfil del usuario para verificar si es médico
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, doctor_id')
        .eq('user_id', currentUser.id)
        .single();

      if (profile?.role === 'doctor') {
        // Solo suscribirse a cambios de sus propias recetas
        const doctorPrescriptionsChannel = supabase
          .channel('doctor_prescriptions')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'prescriptions',
              filter: `created_by=eq.${currentUser.id}`
            },
            () => {
              // Recargar solo las recetas del médico
              loadPrescriptions();
            }
          )
          .subscribe();

        return () => {
          doctorPrescriptionsChannel.unsubscribe();
        };
      }
    };

    setupSubscriptions();
  }, [user]);

  // Funciones de carga individuales
  const loadDoctors = useCallback(async () => {
    if (loadingDoctors) return;
    
    setLoadingDoctors(true);
    try {
      const doctorsData = await doctorService.getAll();
      setDoctors(doctorsData);
    } catch (err) {
      console.error('Error loading doctors:', err);
    } finally {
      setLoadingDoctors(false);
    }
  }, [loadingDoctors]);

  const loadPatients = useCallback(async (page: number = 1, reset: boolean = true) => {
    if (loadingPatients) return;
    
    setLoadingPatients(true);
    try {
      const { patients: patientsData, totalCount, hasMore } = await patientService.getAll(page, 100);
      
      if (reset || page === 1) {
        setPatients(patientsData);
      } else {
        setPatients(prev => [...prev, ...patientsData]);
      }
      
      setPatientsMetadata({
        totalCount,
        currentPage: page,
        pageSize: 100,
        hasMore
      });
    } catch (err) {
      console.error('Error loading patients:', err);
      if (reset || page === 1) {
        setPatients([]);
        setPatientsMetadata({
          totalCount: 0,
          currentPage: 1,
          pageSize: 100,
          hasMore: false
        });
      }
    } finally {
      setLoadingPatients(false);
    }
  }, [loadingPatients]);

  const searchPatients = useCallback(async (
    searchTerm: string, 
    filters: any = {}, 
    page: number = 1, 
    reset: boolean = true
  ) => {
    if (loadingPatients) return;
    
    setLoadingPatients(true);
    try {
      const { patients: patientsData, totalCount, hasMore } = await patientService.search(
        searchTerm, 
        filters, 
        page, 
        100
      );
      
      if (reset || page === 1) {
        setPatients(patientsData);
      } else {
        setPatients(prev => [...prev, ...patientsData]);
      }
      
      setPatientsMetadata({
        totalCount,
        currentPage: page,
        pageSize: 100,
        hasMore
      });
    } catch (err) {
      console.error('Error searching patients:', err);
      if (reset || page === 1) {
        setPatients([]);
        setPatientsMetadata({
          totalCount: 0,
          currentPage: 1,
          pageSize: 100,
          hasMore: false
        });
      }
    } finally {
      setLoadingPatients(false);
    }
  }, [loadingPatients]);
  const loadPractices = useCallback(async () => {
    if (loadingPractices) return;
    
    setLoadingPractices(true);
    try {
      const practicesData = await practiceService.getAll();
      setPractices(practicesData);
    } catch (err) {
      console.error('Error loading practices:', err);
      // No fallar silenciosamente, mantener el estado anterior
      // setPractices([]);
    } finally {
      setLoadingPractices(false);
    }
  }, [loadingPractices]);

  const loadPrescriptions = useCallback(async () => {
    if (loadingPrescriptionsRef.current) return;
    
    setLoadingPrescriptions(true);
    try {
      const prescriptionsData = await prescriptionService.getAll();
      setPrescriptions(prescriptionsData);
    } catch (err) {
      console.error('Error loading prescriptions:', err);
      // Set empty array on error to prevent crashes
      setPrescriptions([]);
    } finally {
      setLoadingPrescriptions(false);
    }
  }, []);

  const loadSocialWorks = useCallback(async () => {
    if (loadingSocialWorks) return;
    
    setLoadingSocialWorks(true);
    try {
      const socialWorksData = await socialWorkService.getAll();
      setSocialWorks(socialWorksData);
    } catch (err) {
      console.error('Error loading social works:', err);
      // Set empty array on error to prevent crashes
      setSocialWorks([]);
    } finally {
      setLoadingSocialWorks(false);
    }
  }, [loadingSocialWorks]);

  const loadSocialWorkPlans = useCallback(async () => {
    if (loadingSocialWorkPlans) return;
    
    setLoadingSocialWorkPlans(true);
    try {
      const socialWorkPlansData = await socialWorkPlanService.getAll();
      setSocialWorkPlans(socialWorkPlansData);
    } catch (err) {
      console.error('Error loading social work plans:', err);
      // Set empty array on error to prevent crashes
      setSocialWorkPlans([]);
    } finally {
      setLoadingSocialWorkPlans(false);
    }
  }, [loadingSocialWorkPlans]);

  const getSocialWorkPlans = useCallback((socialWorkId: string): SocialWorkPlan[] => {
    return socialWorkPlans.filter(plan => plan.socialWorkId === socialWorkId && plan.isActive);
  }, [socialWorkPlans]);

  const refreshData = useCallback(async () => {
    // Recargar todos los datos
    await Promise.all([
      loadDoctors(),
      loadPatients(),
      loadPractices(),
      loadPrescriptions(),
      loadSocialWorks(),
      loadSocialWorkPlans()
    ]);
  }, [loadDoctors, loadPatients, loadPractices, loadPrescriptions, loadSocialWorks, loadSocialWorkPlans]);

  // Funciones para médicos
  const addDoctor = async (doctorData: Omit<Doctor, 'id'>) => {
    try {
      const newDoctor = await doctorService.create(doctorData);
      setDoctors(prev => [...prev, newDoctor]);
    } catch (err) {
      console.error('Error adding doctor:', err);
      throw err;
    }
  };

  const updateDoctor = async (id: string, doctorData: Partial<Doctor>) => {
    try {
      const updatedDoctor = await doctorService.update(id, doctorData);
      setDoctors(prev => prev.map(d => d.id === id ? updatedDoctor : d));
    } catch (err) {
      console.error('Error updating doctor:', err);
      throw err;
    }
  };

  const deleteDoctor = async (id: string) => {
    try {
      await doctorService.delete(id);
      setDoctors(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error('Error deleting doctor:', err);
      throw err;
    }
  };

  // Funciones para pacientes
  const addPatient = async (patientData: Omit<Patient, 'id'>) => {
    try {
      const newPatient = await patientService.create(patientData);
      setPatients(prev => [...prev, newPatient]);
      setPatientsMetadata(prev => ({
        ...prev,
        totalCount: prev.totalCount + 1
      }));
      return newPatient;
    } catch (err) {
      console.error('Error adding patient:', err);
      throw err;
    }
  };

  const updatePatient = async (id: string, patientData: Partial<Patient>) => {
    try {
      const updatedPatient = await patientService.update(id, patientData);
      setPatients(prev => prev.map(p => p.id === id ? updatedPatient : p));
    } catch (err) {
      console.error('Error updating patient:', err);
      throw err;
    }
  };

  const deletePatient = async (id: string) => {
    try {
      await patientService.delete(id);
      setPatients(prev => prev.filter(p => p.id !== id));
      setPatientsMetadata(prev => ({
        ...prev,
        totalCount: Math.max(0, prev.totalCount - 1)
      }));
    } catch (err) {
      console.error('Error deleting patient:', err);
      throw err;
    }
  };

  // Funciones para prácticas
  const addPractice = async (practiceData: Omit<Practice, 'id'>) => {
    try {
      const newPractice = await practiceService.create(practiceData);
      setPractices(prev => [...prev, newPractice]);
    } catch (err) {
      console.error('Error adding practice:', err);
      throw err;
    }
  };

  const updatePractice = async (id: string, practiceData: Partial<Practice>) => {
    try {
      const updatedPractice = await practiceService.update(id, practiceData);
      setPractices(prev => prev.map(p => p.id === id ? updatedPractice : p));
    } catch (err) {
      console.error('Error updating practice:', err);
      throw err;
    }
  };

  const deletePractice = async (id: string) => {
    try {
      await practiceService.delete(id);
      setPractices(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting practice:', err);
      throw err;
    }
  };

  // Funciones para recetas
  const getNextPrescriptionNumber = async (): Promise<number> => {
    try {
      return await prescriptionService.getNextNumber();
    } catch (err) {
      console.error('Error getting next prescription number:', err);
      throw err;
    }
  };

  const addPrescription = async (prescriptionData: Omit<Prescription, 'id' | 'number' | 'createdAt'>) => {
    try {
      const newPrescription = await prescriptionService.create(prescriptionData);
      setPrescriptions(prev => [newPrescription, ...prev]);
    } catch (err) {
      console.error('Error adding prescription:', err);
      throw err;
    }
  };

  const updatePrescription = async (id: string, prescriptionData: Partial<Prescription>) => {
    try {
      const updatedPrescription = await prescriptionService.update(id, prescriptionData);
      setPrescriptions(prev => prev.map(p => p.id === id ? updatedPrescription : p));
    } catch (err) {
      console.error('Error updating prescription:', err);
      throw err;
    }
  };

  const deletePrescription = async (id: string) => {
    try {
      await prescriptionService.delete(id);
      setPrescriptions(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting prescription:', err);
      throw err;
    }
  };

  const updatePrescriptionAuthorization = async (id: string, authorized: boolean) => {
    try {
      await prescriptionService.updateAuthorization(id, authorized);
      setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, authorized } : p));
    } catch (err) {
      console.error('Error updating prescription authorization:', err);
      throw err;
    }
  };

  // Funciones para obras sociales
  const addSocialWork = async (socialWorkData: Omit<SocialWork, 'id'>) => {
    try {
      const newSocialWork = await socialWorkService.create(socialWorkData);
      setSocialWorks(prev => [...prev, newSocialWork]);
    } catch (err) {
      console.error('Error adding social work:', err);
      throw err;
    }
  };

  const updateSocialWork = async (id: string, socialWorkData: Partial<SocialWork>) => {
    try {
      const updatedSocialWork = await socialWorkService.update(id, socialWorkData);
      setSocialWorks(prev => prev.map(sw => sw.id === id ? updatedSocialWork : sw));
    } catch (err) {
      console.error('Error updating social work:', err);
      throw err;
    }
  };

  const deleteSocialWork = async (id: string) => {
    try {
      await socialWorkService.delete(id);
      setSocialWorks(prev => prev.filter(sw => sw.id !== id));
    } catch (err) {
      console.error('Error deleting social work:', err);
      throw err;
    }
  };

  // Funciones para planes de obras sociales
  const addSocialWorkPlan = async (planData: Omit<SocialWorkPlan, 'id'>) => {
    try {
      const newPlan = await socialWorkPlanService.create(planData);
      setSocialWorkPlans(prev => [...prev, newPlan]);
    } catch (err) {
      console.error('Error adding social work plan:', err);
      throw err;
    }
  };

  const updateSocialWorkPlan = async (id: string, planData: Partial<SocialWorkPlan>) => {
    try {
      const updatedPlan = await socialWorkPlanService.update(id, planData);
      setSocialWorkPlans(prev => prev.map(p => p.id === id ? updatedPlan : p));
    } catch (err) {
      console.error('Error updating social work plan:', err);
      throw err;
    }
  };

  const deleteSocialWorkPlan = async (id: string) => {
    try {
      await socialWorkPlanService.delete(id);
      setSocialWorkPlans(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting social work plan:', err);
      throw err;
    }
  };

  const searchPatientsForAutocomplete = async (searchTerm: string): Promise<Patient[]> => {
    try {
      return await patientService.searchForAutocomplete(searchTerm, 50);
    } catch (err) {
      console.error('Error searching patients for autocomplete:', err);
      return [];
    }
  };

  const value = {
    doctors,
    patients,
    patientsMetadata,
    practices,
    prescriptions,
    socialWorks,
    socialWorkPlans,
    loadingDoctors,
    loadingPatients,
    loadingPractices,
    loadingPrescriptions,
    loadingSocialWorks,
    loadingSocialWorkPlans,
    loadDoctors,
    loadPatients,
    searchPatients,
    loadPractices,
    loadPrescriptions,
    loadSocialWorks,
    loadSocialWorkPlans,
    getSocialWorkPlans,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    addPatient,
    updatePatient,
    deletePatient,
    addPractice,
    updatePractice,
    deletePractice,
    addPrescription,
    updatePrescription,
    updatePrescriptionAuthorization,
    deletePrescription,
    addSocialWork,
    updateSocialWork,
    deleteSocialWork,
    addSocialWorkPlan,
    updateSocialWorkPlan,
    deleteSocialWorkPlan,
    searchPatientsForAutocomplete,
    getNextPrescriptionNumber,
    refreshData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}