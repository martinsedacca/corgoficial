import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Doctor, Patient, Practice, Prescription } from '../types';
import { doctorService, patientService, practiceService, prescriptionService } from '../services/supabaseService';

interface DataContextType {
  doctors: Doctor[];
  patients: Patient[];
  practices: Practice[];
  prescriptions: Prescription[];
  loading: boolean;
  error: string | null;
  addDoctor: (doctor: Omit<Doctor, 'id'>) => Promise<void>;
  updateDoctor: (id: string, doctor: Partial<Doctor>) => Promise<void>;
  deleteDoctor: (id: string) => Promise<void>;
  addPatient: (patient: Omit<Patient, 'id'>) => Promise<void>;
  updatePatient: (id: string, patient: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  addPractice: (practice: Omit<Practice, 'id'>) => Promise<void>;
  updatePractice: (id: string, practice: Partial<Practice>) => Promise<void>;
  deletePractice: (id: string) => Promise<void>;
  addPrescription: (prescription: Omit<Prescription, 'id' | 'number' | 'createdAt'>) => Promise<void>;
  updatePrescription: (id: string, prescription: Partial<Prescription>) => Promise<void>;
  deletePrescription: (id: string) => Promise<void>;
  getNextPrescriptionNumber: () => Promise<number>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos iniciales
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [doctorsData, patientsData, practicesData, prescriptionsData] = await Promise.all([
        doctorService.getAll(),
        patientService.getAll(),
        practiceService.getAll(),
        prescriptionService.getAll()
      ]);
      
      setDoctors(doctorsData);
      setPatients(patientsData);
      setPractices(practicesData);
      setPrescriptions(prescriptionsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshData = async () => {
    await loadData();
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

  const value = {
    doctors,
    patients,
    practices,
    prescriptions,
    loading,
    error,
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
    deletePrescription,
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