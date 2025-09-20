import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';
import { PrescriptionForm } from './PrescriptionForm';
import { PrescriptionViewer } from './PrescriptionViewer';
import PrescriptionHistory from './PrescriptionHistory';
import { DoctorManager } from './DoctorManager';
import { PatientManager } from './PatientManager';
import { PracticeAdmin } from './PracticeAdmin';
import { SocialWorkManager } from './SocialWorkManager';
import { Dashboard } from './Dashboard';
import { UserManager } from './UserManager';
import { Prescription } from '../types';
import { FileText, History, User, Users, Activity, Building2, BarChart3, Settings, LogOut } from 'lucide-react';

type View = 'dashboard' | 'new' | 'history' | 'doctors' | 'patients' | 'practices' | 'admin-practices' | 'social-works' | 'users';

export function AppContent() {
  const { profile, signOut, hasPermission } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);

  const handlePrescriptionSubmit = (prescriptionData: any) => {
    setEditingPrescription(null);
    setCurrentView('history');
  };

  const handleViewPrescription = (prescription: Prescription) => {
    setViewingPrescription(prescription);
  };

  const handleEditPrescription = (prescription: Prescription) => {
    setEditingPrescription(prescription);
    setCurrentView('new');
  };

  const handleCancelEdit = () => {
    setEditingPrescription(null);
    setCurrentView('history');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'text-blue-600' },
    { key: 'history', label: 'Recetas', icon: History, color: 'text-gray-600' },
    ...(hasPermission('manage_doctors') ? [{ key: 'doctors', label: 'Médicos', icon: User, color: 'text-primary-600' }] : []),
    ...(hasPermission('manage_patients') ? [{ key: 'patients', label: 'Pacientes', icon: Users, color: 'text-green-600' }] : []),
    ...(hasPermission('manage_practices') ? [{ key: 'admin-practices', label: 'Administrar Prácticas', icon: Activity, color: 'text-purple-600' }] : []),
    ...(hasPermission('manage_social_works') ? [{ key: 'social-works', label: 'Obras Sociales', icon: Building2, color: 'text-blue-600' }] : []),
    ...(hasPermission('manage_users') ? [{ key: 'users', label: 'Usuarios', icon: Settings, color: 'text-red-600' }] : [])
  ].filter(Boolean);

  if (viewingPrescription) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <button
              onClick={() => setViewingPrescription(null)}
              className="text-primary-600 hover:text-primary-800 font-medium"
            >
              ← Volver al historial
            </button>
          </div>
          <PrescriptionViewer prescription={viewingPrescription} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between py-3 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <img 
                src="/Logo-corg.png" 
                alt="CORG Logo" 
                className="h-8 sm:h-10 w-auto"
              />
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-900">{profile?.full_name}</div>
                <div className="text-xs text-gray-500 capitalize">{profile?.role}</div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-1 mt-2 sm:mt-0 sm:space-x-1 flex-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => setCurrentView(item.key as View)}
                    className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      currentView === item.key
                        ? 'bg-primary-100 text-primary-700 border border-primary-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${currentView === item.key ? 'text-primary-600' : item.color.replace('blue', 'primary')}`} />
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="sm:hidden text-xs">{item.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-red-600 hover:text-red-900 hover:bg-red-50 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'new' && (
          <PrescriptionForm
            onSubmit={handlePrescriptionSubmit}
            onCancel={editingPrescription ? handleCancelEdit : () => setCurrentView('history')}
            editingPrescription={editingPrescription}
          />
        )}
        {currentView === 'history' && (
          <PrescriptionHistory 
            onViewPrescription={handleViewPrescription} 
            onEditPrescription={handleEditPrescription}
            onNewPrescription={() => setCurrentView('new')}
          />
        )}
        {currentView === 'doctors' && <DoctorManager />}
        {currentView === 'patients' && <PatientManager />}
        {currentView === 'admin-practices' && <PracticeAdmin />}
        {currentView === 'social-works' && <SocialWorkManager />}
        {currentView === 'users' && <UserManager />}
      </div>
    </div>
  );
}