import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface NotificationState {
  hasNewPrescriptions: boolean;
  hasUpdatedPrescriptions: boolean;
  hasNewPatients: boolean;
  hasNewDoctors: boolean;
  hasNewPractices: boolean;
  hasNewSocialWorks: boolean;
}

export function useRealtimeNotifications() {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<NotificationState>({
    hasNewPrescriptions: false,
    hasUpdatedPrescriptions: false,
    hasNewPatients: false,
    hasNewDoctors: false,
    hasNewPractices: false,
    hasNewSocialWorks: false
  });

  const clearNotifications = useCallback(() => {
    setNotifications({
      hasNewPrescriptions: false,
      hasUpdatedPrescriptions: false,
      hasNewPatients: false,
      hasNewDoctors: false,
      hasNewPractices: false,
      hasNewSocialWorks: false
    });
  }, []);

  const clearSpecificNotification = useCallback((type: keyof NotificationState) => {
    setNotifications(prev => ({
      ...prev,
      [type]: false
    }));
  }, []);

  const hasAnyNotification = Object.values(notifications).some(Boolean);

  useEffect(() => {
    // Solo configurar notificaciones para administradores y secretarias
    // Los médicos NO deben recibir actualizaciones en tiempo real de recetas
    if (!user || !profile) return;
    
    // Excluir específicamente a los médicos
    if (profile.role === 'doctor') return;

    console.log('Setting up realtime notifications for user:', user.id);

    // Suscripción a cambios en prescriptions
    const prescriptionsChannel = supabase
      .channel('notifications:prescriptions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'prescriptions'
        },
        (payload) => {
          console.log('New prescription detected:', payload);
          // Solo notificar si no fue creada por el usuario actual
          if (payload.new.created_by !== user.id) {
            setNotifications(prev => ({ ...prev, hasNewPrescriptions: true }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'prescriptions'
        },
        (payload) => {
          console.log('Prescription updated:', payload);
          // Solo notificar si no fue actualizada por el usuario actual
          if (payload.new.created_by !== user.id) {
            setNotifications(prev => ({ ...prev, hasUpdatedPrescriptions: true }));
          }
        }
      )
      .subscribe();

    // Suscripción a cambios en patients
    const patientsChannel = supabase
      .channel('notifications:patients')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'patients'
        },
        (payload) => {
          console.log('New patient detected:', payload);
          setNotifications(prev => ({ ...prev, hasNewPatients: true }));
        }
      )
      .subscribe();

    // Suscripción a cambios en doctors
    const doctorsChannel = supabase
      .channel('notifications:doctors')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'doctors'
        },
        (payload) => {
          console.log('New doctor detected:', payload);
          setNotifications(prev => ({ ...prev, hasNewDoctors: true }));
        }
      )
      .subscribe();

    // Suscripción a cambios en practices
    const practicesChannel = supabase
      .channel('notifications:practices')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'practices'
        },
        (payload) => {
          console.log('New practice detected:', payload);
          setNotifications(prev => ({ ...prev, hasNewPractices: true }));
        }
      )
      .subscribe();

    // Suscripción a cambios en social_works
    const socialWorksChannel = supabase
      .channel('notifications:social_works')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'social_works'
        },
        (payload) => {
          console.log('New social work detected:', payload);
          setNotifications(prev => ({ ...prev, hasNewSocialWorks: true }));
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      console.log('Cleaning up notification subscriptions...');
      prescriptionsChannel.unsubscribe();
      patientsChannel.unsubscribe();
      doctorsChannel.unsubscribe();
      practicesChannel.unsubscribe();
      socialWorksChannel.unsubscribe();
    };

  return {
    notifications,
    hasAnyNotification,
    clearNotifications,
    clearSpecificNotification
  };
}