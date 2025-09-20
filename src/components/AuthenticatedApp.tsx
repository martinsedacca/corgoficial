import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm } from './LoginForm';
import { UserRegistration } from './UserRegistration';
import { UserRegistration } from './UserRegistration';
import { LoadingSpinner } from './LoadingSpinner';
import { AppContent } from './AppContent';

export function AuthenticatedApp() {
  const { user, profile, loading } = useAuth();
  const [showRegistration, setShowRegistration] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);

  console.log('AuthenticatedApp - Estado:', { 
    loading, 
    hasUser: !!user, 
    hasProfile: !!profile,
    userEmail: user?.email 
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando aplicación..." />
      </div>
    );
  }

  // Si no hay usuario y se solicita registro
  if (!user && showRegistration) {
    return <UserRegistration onBack={() => setShowRegistration(false)} />;
  }

  // Si no hay usuario autenticado, mostrar login
  if (!user) {
    console.log('No hay usuario, mostrando login');
    return <LoginForm onShowRegistration={() => setShowRegistration(true)} />;
      return <UserRegistration />;
    }
    return (
      <LoginForm 
        onShowRegistration={() => setShowRegistration(true)}
      />
    );
  }

  // Si hay usuario pero no tiene perfil, mostrar error
  if (!profile) {
    console.log('Usuario sin perfil válido');
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error de Perfil
          </h2>
          <p className="text-gray-600 mb-6">
            Su cuenta no tiene un perfil válido. Contacte al administrador del sistema.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Si el usuario no está activo, mostrar mensaje
  if (!profile.is_active) {
    console.log('Usuario inactivo');
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-yellow-600 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Cuenta Inactiva
          </h2>
          <p className="text-gray-600 mb-6">
            Su cuenta ha sido desactivada. Contacte al administrador del sistema.
          </p>
        </div>
      </div>
    );
  }

  // Usuario autenticado y con perfil válido
  console.log('Usuario autenticado correctamente, mostrando app');
  return <AppContent />;
}