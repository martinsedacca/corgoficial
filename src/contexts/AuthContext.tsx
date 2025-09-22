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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
    }).catch((error) => {
      console.warn('Error getting initial session:', error);
      // Continue without session if Supabase is not configured
      setSession(null);
      setUser(null);
      setProfile(null);
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          loadUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.warn('Supabase not configured, using fallback profile');
        const fallbackProfile: UserProfile = {
          id: 'fallback-admin',
          user_id: userId,
          email: user?.email || 'admin@corg.com',
          full_name: 'Administrador',
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setProfile(fallbackProfile);
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Handle Supabase not configured error
        if (error.message?.includes('Supabase not configured')) {
          console.warn('Supabase not configured, using fallback profile');
          // Create a fallback admin profile for development
          const fallbackProfile: UserProfile = {
            id: 'fallback-admin',
            user_id: userId,
            email: user?.email || 'admin@corg.com',
            full_name: 'Administrador',
            role: 'admin',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setProfile(fallbackProfile);
          return;
        }
        
        // If JWT is expired, sign out the user
        if (error.message?.includes('JWT expired')) {
          console.log('JWT expired, signing out user');
          await supabase.auth.signOut();
          return;
        }
        
        console.error('Error loading profile:', error);
        // Si es m.sedacca@gmail.com, crear perfil de admin automáticamente
        if (session?.user?.email === 'm.sedacca@gmail.com') {
          const adminProfile: UserProfile = {
            id: 'admin-' + userId,
            user_id: userId,
            email: 'm.sedacca@gmail.com',
            full_name: 'Administrador',
            role: 'admin',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setProfile(adminProfile);
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      // If JWT is expired, sign out the user
      if (error instanceof Error && error.message?.includes('JWT expired')) {
        console.log('JWT expired, signing out user');
        await supabase.auth.signOut();
        return;
      }
      
      console.error('Error in loadUserProfile:', error);
      // Si es m.sedacca@gmail.com, crear perfil de admin automáticamente
      if (session?.user?.email === 'm.sedacca@gmail.com') {
        const adminProfile: UserProfile = {
          id: 'admin-' + userId,
          user_id: userId,
          email: 'm.sedacca@gmail.com',
          full_name: 'Administrador',
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setProfile(adminProfile);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        return { error: { message: 'Supabase no está configurado. Por favor, configure las variables de entorno.' } };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      console.error('Network error during sign in:', error);
      return { error: { message: 'Error de conexión. Verifique su conexión a internet y la configuración de Supabase.' } };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Error during sign out:', error);
    } finally {
      setProfile(null);
      setUser(null);
      setSession(null);
    }
  };

  // Para m.sedacca@gmail.com siempre dar acceso completo
  const hasPermission = (permission: string): boolean => {
    if (session?.user?.email === 'm.sedacca@gmail.com') {
      return true; // Acceso completo sin restricciones
    }
    
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
        'manage_prescriptions',
        'create_prescriptions_own_name'
      ]
    };

    return permissions[profile.role]?.includes(permission) || false;
  };

  const isAdmin = session?.user?.email === 'm.sedacca@gmail.com' || profile?.role === 'admin';
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