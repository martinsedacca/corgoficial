import React, { createContext, useContext, ReactNode } from 'react';
import { Doctor, Patient, Practice, Prescription } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { mockDoctors, mockPatients, mockPractices } from '../data/mockData';

interface DataContextType {
  doctors: Doctor[];
  patients: Patient[];
  practices: Practice[];
  prescriptions: Prescription[];
  addDoctor: (doctor: Omit<Doctor, 'id'>) => void;
  updateDoctor: (id: string, doctor: Partial<Doctor>) => void;
  deleteDoctor: (id: string) => void;
  addPatient: (patient: Omit<Patient, 'id'>) => void;
  updatePatient: (id: string, patient: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  addPractice: (practice: Omit<Practice, 'id'>) => void;
  updatePractice: (id: string, practice: Partial<Practice>) => void;
  deletePractice: (id: string) => void;
  addPrescription: (prescription: Omit<Prescription, 'id' | 'number' | 'createdAt'>) => void;
  getNextPrescriptionNumber: () => number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [doctors, setDoctors] = useLocalStorage<Doctor[]>('doctors', mockDoctors);
  const [patients, setPatients] = useLocalStorage<Patient[]>('patients', mockPatients);
  const [practices, setPractices] = useLocalStorage<Practice[]>('practices', mockPractices);
  const [prescriptions, setPrescriptions] = useLocalStorage<Prescription[]>('prescriptions', []);

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const getNextPrescriptionNumber = () => {
    const maxNumber = prescriptions.reduce((max, p) => Math.max(max, p.number), 0);
    return maxNumber + 1;
  };

  const addDoctor = (doctorData: Omit<Doctor, 'id'>) => {
    const newDoctor = { ...doctorData, id: generateId() };
    setDoctors(prev => [...prev, newDoctor]);
  };

  const updateDoctor = (id: string, doctorData: Partial<Doctor>) => {
    setDoctors(prev => prev.map(d => d.id === id ? { ...d, ...doctorData } : d));
  };

  const deleteDoctor = (id: string) => {
    setDoctors(prev => prev.filter(d => d.id !== id));
  };

  const addPatient = (patientData: Omit<Patient, 'id'>) => {
    const newPatient = { ...patientData, id: generateId() };
    setPatients(prev => [...prev, newPatient]);
  };

  const updatePatient = (id: string, patientData: Partial<Patient>) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...patientData } : p));
  };

  const deletePatient = (id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
  };

  const addPractice = (practiceData: Omit<Practice, 'id'>) => {
    const newPractice = { ...practiceData, id: generateId() };
    setPractices(prev => [...prev, newPractice]);
  };

  const updatePractice = (id: string, practiceData: Partial<Practice>) => {
    setPractices(prev => prev.map(p => p.id === id ? { ...p, ...practiceData } : p));
  };

  const deletePractice = (id: string) => {
    setPractices(prev => prev.filter(p => p.id !== id));
  };

  const addPrescription = (prescriptionData: Omit<Prescription, 'id' | 'number' | 'createdAt'>) => {
    const newPrescription: Prescription = {
      ...prescriptionData,
      id: generateId(),
      number: getNextPrescriptionNumber(),
      createdAt: new Date().toISOString()
    };
    setPrescriptions(prev => [...prev, newPrescription]);
  };

  const value = {
    doctors,
    patients,
    practices,
    prescriptions,
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
    getNextPrescriptionNumber
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