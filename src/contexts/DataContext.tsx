import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Doctor, Patient, Practice, Prescription, SocialWork } from '../types';
import { doctorService, patientService, practiceService, prescriptionService, socialWorkService } from '../services/supabaseService';

interface DataContextType {
  doctors: Doctor[];
  patients: Patient[];
  practices: Practice[];
  prescriptions: Prescription[];
  socialWorks: SocialWork[];
  loadingDoctors: boolean;
  loadingPatients: boolean;
  loadingPractices: boolean;
  loadingPrescriptions: boolean;
  loadingSocialWorks: boolean;
  loadDoctors: () => Promise<void>;
  loadPatients: () => Promise<void>;
  loadPractices: () => Promise<void>;
  loadPrescriptions: () => Promise<void>;
  loadSocialWorks: () => Promise<void>;
  addDoctor: (doctor: Omit<Doctor, 'id'>) => Promise<void>;
  updateDoctor: (id: string, doctor: Partial<Doctor>) => Promise<void>;
  deleteDoctor: (id: string) => Promise<void>;
  addPatient: (patient: Omit<Patient, 'id'>) => Promise<Patient>;
  updatePatient: (id: string, patient: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  addPractice: (practice: Omit<Practice, 'id'>) => Promise<void>;
  updatePractice: (id: string, practice: Partial<Practice>) => Promise<void>;
  deletePractice: (id: string) => Promise<void>;
  addPrescription: (prescription: Omit<Prescription, 'id' | 'number' | 'createdAt'>) => Promise<void>;
  updatePrescription: (id: string, prescription: Partial<Prescription>) => Promise<void>;
  deletePrescription: (id: string) => Promise<void>;
  addSocialWork: (socialWork: Omit<SocialWork, 'id'>) => Promise<void>;
  updateSocialWork: (id: string, socialWork: Partial<SocialWork>) => Promise<void>;
  deleteSocialWork: (id: string) => Promise<void>;
  getNextPrescriptionNumber: () => Promise<number>;
  updatePrescriptionAuthorization: (id: string, authorized: boolean) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [socialWorks, setSocialWorks] = useState<SocialWork[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingPractices, setLoadingPractices] = useState(false);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [loadingSocialWorks, setLoadingSocialWorks] = useState(false);

  // Funciones de carga individuales
  const loadDoctors = async () => {
    if (loadingDoctors || doctors.length > 0 || !user) return; // Evitar cargas duplicadas
    
    setLoadingDoctors(true);
    try {
      const doctorsData = await doctorService.getAll();
      setDoctors(doctorsData);
    } catch (err) {
      console.error('Error loading doctors:', err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const loadPatients = async () => {
    if (loadingPatients || patients.length > 0 || !user) return;
    
    setLoadingPatients(true);
    try {
      const patientsData = await patientService.getAll();
      setPatients(patientsData);
    } catch (err) {
      console.error('Error loading patients:', err);
    } finally {
      setLoadingPatients(false);
    }
  };

  const loadPractices = async () => {
    if (loadingPractices || practices.length > 0 || !user) return;
    
    setLoadingPractices(true);
    try {
      const practicesData = await practiceService.getAll();
      setPractices(practicesData);
    } catch (err) {
      console.error('Error loading practices:', err);
    } finally {
      setLoadingPractices(false);
    }
  };

  const loadPrescriptions = async () => {
    if (loadingPrescriptions || prescriptions.length > 0 || !user) return;
    
    setLoadingPrescriptions(true);
    try {
      const prescriptionsData = await prescriptionService.getAll();
      setPrescriptions(prescriptionsData);
    } catch (err) {
      console.error('Error loading prescriptions:', err);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const loadSocialWorks = async () => {
    if (loadingSocialWorks || socialWorks.length > 0 || !user) return;
    
    setLoadingSocialWorks(true);
    try {
      const socialWorksData = await socialWorkService.getAll();
      setSocialWorks(socialWorksData);
    } catch (err) {
      console.error('Error loading social works:', err);
    } finally {
      setLoadingSocialWorks(false);
    }
  };

  const refreshData = async () => {
    if (!user) return;
    
    // Recargar solo los datos que ya están cargados
    const promises = [];
    
    if (doctors.length > 0) {
      setDoctors([]);
      promises.push(loadDoctors());
    }
    if (patients.length > 0) {
      setPatients([]);
      promises.push(loadPatients());
    }
    if (practices.length > 0) {
      setPractices([]);
      promises.push(loadPractices());
    }
    if (prescriptions.length > 0) {
      setPrescriptions([]);
      promises.push(loadPrescriptions());
    }
    if (socialWorks.length > 0) {
      setSocialWorks([]);
      promises.push(loadSocialWorks());
    }
    
    await Promise.all(promises);
  };

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

  const value = {
    doctors,
    patients,
    practices,
    prescriptions,
    socialWorks,
    loadingDoctors,
    loadingPatients,
    loadingPractices,
    loadingPrescriptions,
    loadingSocialWorks,
    loadDoctors,
    loadPatients,
    loadPractices,
    loadPrescriptions,
    loadSocialWorks,
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