import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a mock client if environment variables are missing
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl === 'YOUR_SUPABASE_URL' || 
      supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY' ||
      supabaseUrl === '' || 
      supabaseAnonKey === '' ||
      supabaseUrl.includes('placeholder') ||
      supabaseAnonKey.includes('placeholder')) {
    console.warn('Supabase environment variables not found. Using mock client.');
    // Return a mock client that doesn't make actual requests
    const mockError = { message: 'Supabase not configured' };
    const mockData = null;
    
    const createMockQueryBuilder = () => ({
      select: () => createMockQueryBuilder(),
      insert: () => createMockQueryBuilder(),
      update: () => createMockQueryBuilder(),
      delete: () => createMockQueryBuilder(),
      eq: () => createMockQueryBuilder(),
      neq: () => createMockQueryBuilder(),
      gt: () => createMockQueryBuilder(),
      gte: () => createMockQueryBuilder(),
      lt: () => createMockQueryBuilder(),
      lte: () => createMockQueryBuilder(),
      like: () => createMockQueryBuilder(),
      ilike: () => createMockQueryBuilder(),
      is: () => createMockQueryBuilder(),
      in: () => createMockQueryBuilder(),
      contains: () => createMockQueryBuilder(),
      containedBy: () => createMockQueryBuilder(),
      rangeGt: () => createMockQueryBuilder(),
      rangeGte: () => createMockQueryBuilder(),
      rangeLt: () => createMockQueryBuilder(),
      rangeLte: () => createMockQueryBuilder(),
      rangeAdjacent: () => createMockQueryBuilder(),
      overlaps: () => createMockQueryBuilder(),
      textSearch: () => createMockQueryBuilder(),
      match: () => createMockQueryBuilder(),
      not: () => createMockQueryBuilder(),
      or: () => createMockQueryBuilder(),
      filter: () => createMockQueryBuilder(),
      order: () => createMockQueryBuilder(),
      limit: () => createMockQueryBuilder(),
      range: () => createMockQueryBuilder(),
      count: 'exact',
      head: true,
      single: () => Promise.resolve({ data: mockData, error: mockError }),
      maybeSingle: () => Promise.resolve({ data: mockData, error: mockError }),
      then: (resolve: any) => resolve({ data: mockData, error: mockError, count: 0 })
    });
    
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        resetPasswordForEmail: () => Promise.resolve({ error: mockError }),
        signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: mockError }),
        signUp: () => Promise.resolve({ data: { user: null, session: null }, error: mockError }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        admin: {
          createUser: () => Promise.resolve({ data: { user: null }, error: mockError }),
          deleteUser: () => Promise.resolve({ error: mockError })
        }
      },
      from: () => createMockQueryBuilder(),
      channel: () => ({
        on: () => ({ subscribe: () => {} }),
        subscribe: () => {},
        unsubscribe: () => {}
      }),
      rpc: () => Promise.resolve({ data: 1, error: mockError })
    } as any;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 20
      }
    }
  });
};

export const supabase = createSupabaseClient();

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
          dx: string | null;
          date: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          number: number;
          type: 'studies' | 'treatments' | 'authorization';
          doctor_id: string;
          patient_id: string;
          additional_notes?: string | null;
          dx?: string | null;
          date?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          number?: number;
          type?: 'studies' | 'treatments' | 'authorization';
          doctor_id?: string;
          patient_id?: string;
          additional_notes?: string | null;
          dx?: string | null;
          date?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
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
      social_work_plans: {
        Row: {
          id: string;
          social_work_id: string;
          name: string;
          code: string | null;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          social_work_id: string;
          name: string;
          code?: string | null;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          social_work_id?: string;
          name?: string;
          code?: string | null;
          description?: string | null;
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