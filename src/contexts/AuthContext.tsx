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
    let mounted = true;

    const initAuth = async () => {
      try {
        // Obtener sesión actual
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);

          // Obtener perfil del usuario
          try {
            const { data: profileData } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', currentSession.user.id)
              .eq('is_active', true)
              .single();

            if (mounted) {
              setProfile(profileData || null);
            }
          } catch (profileError) {
            console.log('No profile found or error loading profile:', profileError);
            if (mounted) {
              setProfile(null);
            }
          }
        } else {
          if (mounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Ejecutar inicialización
    initAuth();

    // Configurar listener de cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state change:', event, newSession?.user?.email);
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user || null);

        if (newSession?.user) {
          try {
            const { data: profileData } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', newSession.user.id)
              .eq('is_active', true)
              .single();

            if (mounted) {
              setProfile(profileData || null);
            }
          } catch (error) {
            console.log('Profile loading error:', error);
            if (mounted) {
              setProfile(null);
            }
          }
        } else {
          if (mounted) {
            setProfile(null);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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