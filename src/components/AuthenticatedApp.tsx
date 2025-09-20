import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm } from './LoginForm';
import { LoadingSpinner } from './LoadingSpinner';
import { AppContent } from './AppContent';

export function AuthenticatedApp() {
  const { user, profile, loading } = useAuth();

  // Si no hay usuario autenticado, mostrar login
  if (!user) {
    return <LoginForm />;
  }

  // Usuario autenticado, mostrar la aplicación
  return <AppContent />;
}