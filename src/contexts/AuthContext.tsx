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
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    let isInitializing = false;

    const initAuth = async () => {
      if (isInitializing) return;
      isInitializing = true;
      
      try {
        console.log('Inicializando autenticación...');
        
        // Obtener sesión actual
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error obteniendo sesión:', sessionError);
          if (mounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        console.log('Sesión actual:', currentSession?.user?.email || 'No hay sesión');

        if (!mounted) return;

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);

          // Intentar obtener perfil del usuario
          try {
            console.log('Cargando perfil para usuario:', currentSession.user.id);
            const { data: profileData, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', currentSession.user.id)
              .single();

            if (profileError) {
              console.log('Error o no se encontró perfil:', profileError.message);
            } else {
              console.log('Perfil cargado:', profileData);
            }

            if (mounted) {
              setProfile(profileData || null);
            }
          } catch (profileError) {
            console.log('Error cargando perfil:', profileError);
            if (mounted) {
              setProfile(null);
            }
          }
        } else {
          console.log('No hay usuario autenticado');
          if (mounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('Error en inicialización de auth:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          console.log('Finalizando carga de autenticación');
          setLoading(false);
          setInitialized(true);
        }
        isInitializing = false;
      }
    };

    // Ejecutar inicialización solo si no se ha inicializado
    if (!initialized) {
      initAuth();
    }

    // Configurar listener de cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Cambio de estado de auth:', event, newSession?.user?.email);
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user || null);

        if (newSession?.user) {
          try {
            const { data: profileData } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', newSession.user.id)
              .single();

            if (mounted) {
              setProfile(profileData || null);
              setLoading(false);
            }
          } catch (error) {
            console.log('Error cargando perfil en cambio de estado:', error);
            if (mounted) {
              setProfile(null);
              setLoading(false);
            }
          }
        } else {
          if (mounted) {
            setProfile(null);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initialized]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      console.error('Error en signIn:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error en signOut:', error);
    }
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