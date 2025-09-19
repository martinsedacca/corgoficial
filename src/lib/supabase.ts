import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para TypeScript basados en la base de datos
export interface Database {
  public: {
    Tables: {
      doctors: {
        Row: {
          id: string;
          name: string;
          specialty: string;
          license: string;
          phone: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          specialty: string;
          license: string;
          phone?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          specialty?: string;
          license?: string;
          phone?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      patients: {
        Row: {
          id: string;
          name: string;
          social_work: string;
          affiliate_number: string;
          plan: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          social_work: string;
          affiliate_number: string;
          plan?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          social_work?: string;
          affiliate_number?: string;
          plan?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      practices: {
        Row: {
          id: string;
          name: string;
          code: string;
          category: 'study' | 'treatment' | 'surgery';
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          category: 'study' | 'treatment' | 'surgery';
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          category?: 'study' | 'treatment' | 'surgery';
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      prescriptions: {
        Row: {
          id: string;
          number: number;
          type: 'studies' | 'treatments' | 'authorization';
          doctor_id: string;
          patient_id: string;
          additional_notes: string | null;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          number: number;
          type: 'studies' | 'treatments' | 'authorization';
          doctor_id: string;
          patient_id: string;
          additional_notes?: string | null;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          number?: number;
          type?: 'studies' | 'treatments' | 'authorization';
          doctor_id?: string;
          patient_id?: string;
          additional_notes?: string | null;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      prescription_items: {
        Row: {
          id: string;
          prescription_id: string;
          practice_id: string;
          ao: 'AO' | 'OI' | 'OD';
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          prescription_id: string;
          practice_id: string;
          ao: 'AO' | 'OI' | 'OD';
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          prescription_id?: string;
          practice_id?: string;
          ao?: 'AO' | 'OI' | 'OD';
          notes?: string | null;
          created_at?: string;
        };
      };
      social_works: {
        Row: {
          id: string;
          name: string;
          code: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          full_name: string;
          role: 'admin' | 'secretary' | 'doctor';
          doctor_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          full_name: string;
          role: 'admin' | 'secretary' | 'doctor';
          doctor_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          full_name?: string;
          role?: 'admin' | 'secretary' | 'doctor';
          doctor_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      get_next_prescription_number: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      get_current_user_profile: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          user_id: string;
          email: string;
          full_name: string;
          role: string;
          doctor_id: string | null;
          is_active: boolean;
        }[];
      };
    };
  };
}