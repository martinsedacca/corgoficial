export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  license: string;
  phone?: string;
  email?: string;
}

export interface Patient {
  id: string;
  name: string;
  socialWork: string;
  affiliateNumber: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Practice {
  id: string;
  name: string;
  code: string;
  category: 'study' | 'treatment' | 'surgery';
  description?: string;
}

export interface PrescriptionItem {
  practiceId: string;
  practice: Practice;
  notes?: string;
  ao?: 'AO' | 'OI' | 'OD';
}

export interface Prescription {
  id: string;
  number: number;
  type: 'studies' | 'treatments' | 'authorization';
  doctorId: string;
  doctor: Doctor;
  patientId: string;
  patient: Patient;
  items: PrescriptionItem[];
  additionalNotes?: string;
  date: string;
  createdAt: string;
}

export interface CompanyInfo {
  name: string;
  subtitle: string;
  director: string;
  license: string;
  address: string;
  phone1: string;
  phone2: string;
  whatsapp: string;
  social: string;
  location: string;
}