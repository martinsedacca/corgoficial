import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'secretary' | 'doctor';
  doctor_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isSecretary: boolean;
  isDoctor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Limpiar cualquier estado previo
    setUser(null);
    setProfile(null);
    setSession(null);
    setLoading(true);
    
    // Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.log('No profile found for user:', userId);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
    // Limpiar estados manualmente
    setSession(null);
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  const hasPermission = (permission: string): boolean => {
    if (!profile) return false;

    const permissions = {
      admin: [
        'view_dashboard',
        'manage_doctors',
        'manage_patients',
        'manage_practices',
        'manage_social_works',
        'manage_prescriptions',
        'manage_users',
        'delete_patients'
      ],
      secretary: [
        'view_dashboard',
        'manage_doctors',
        'manage_patients',
        'manage_practices',
        'manage_social_works',
        'manage_prescriptions',
        'delete_patients'
      ],
      doctor: [
        'manage_patients',
        'manage_prescriptions'
      ]
    };

    return permissions[profile.role]?.includes(permission) || false;
  };

  const isAdmin = profile?.role === 'admin';
  const isSecretary = profile?.role === 'secretary';
  const isDoctor = profile?.role === 'doctor';

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signOut,
    hasPermission,
    isAdmin,
    isSecretary,
    isDoctor
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}