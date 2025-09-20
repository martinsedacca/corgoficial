import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm } from './LoginForm';
import { AppContent } from './AppContent';

export function AuthenticatedApp() {
  const { user } = useAuth();

  if (!user) {
    return <LoginForm />;
  }

  return <AppContent />;
}