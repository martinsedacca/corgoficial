import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';
import { useData } from '../contexts/DataContext';
import { NotificationBanner } from './NotificationBanner';
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
import { PrintFormatSettings } from './PrintFormatSettings';
import { Prescription } from '../types';
import { FileText, History, User, Users, Activity, Building2, BarChart3, Settings, LogOut, ChevronDown } from 'lucide-react';
import { Printer, ToggleLeft, ToggleRight } from 'lucide-react';

type View = 'history' | 'dashboard' | 'new' | 'doctors' | 'patients' | 'practices' | 'admin-practices' | 'social-works' | 'users' | 'print-settings';

export function AppContent() {
  const { user, profile, signOut, hasPermission, isDoctor } = useAuth();
  const { refreshData } = useData();
  const { notifications, hasAnyNotification, clearNotifications } = useRealtimeNotifications();
  const [currentView, setCurrentView] = useState<View>('history');
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
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

  const handleRefreshData = async () => {
    try {
      await refreshData();
      clearNotifications();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const mainMenuItems = [
    { key: 'history', label: 'Recetas', icon: History, color: 'text-gray-600' },
    ...(hasPermission('view_dashboard') ? [{ key: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'text-blue-600' }] : [])
  ];

  const adminMenuItems = [
    ...(hasPermission('manage_doctors') ? [{ key: 'doctors', label: 'Médicos', icon: User, color: 'text-primary-600' }] : []),
    ...(hasPermission('manage_patients') ? [{ key: 'patients', label: 'Pacientes', icon: Users, color: 'text-green-600' }] : []),
    ...(hasPermission('manage_practices') ? [{ key: 'admin-practices', label: 'Prácticas', icon: Activity, color: 'text-purple-600' }] : []),
    ...(hasPermission('manage_social_works') ? [{ key: 'social-works', label: 'Obras Sociales', icon: Building2, color: 'text-blue-600' }] : []),
    ...(hasPermission('manage_users') ? [{ key: 'users', label: 'Usuarios', icon: Settings, color: 'text-red-600' }] : [])
  ].filter(Boolean);

  const hasAdminAccess = adminMenuItems.length > 0;

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
      {/* Notification Banner */}
      {!isDoctor && hasAnyNotification && (
        <NotificationBanner
          hasNewPrescriptions={notifications.hasNewPrescriptions}
          hasUpdatedPrescriptions={notifications.hasUpdatedPrescriptions}
          hasNewPatients={notifications.hasNewPatients}
          hasNewDoctors={notifications.hasNewDoctors}
          hasNewPractices={notifications.hasNewPractices}
          hasNewSocialWorks={notifications.hasNewSocialWorks}
          onRefresh={handleRefreshData}
          onDismiss={clearNotifications}
        />
      )}

      {/* Header */}
      <div className={`bg-white shadow-sm border-b transition-all duration-300 ${!isDoctor && hasAnyNotification ? 'mt-16' : ''}`}>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between py-3 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <img 
                src="/Logo-corg.png" 
                alt="CORG Logo" 
                className="h-8 sm:h-10 w-auto"
              />
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-900">{profile?.full_name || user?.email}</div>
                <div className="text-xs text-gray-500 capitalize">{profile?.role || 'admin'}</div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-1 mt-2 sm:mt-0 sm:space-x-1 flex-1">
              {mainMenuItems.map((item) => {
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
                    <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${currentView === item.key ? 'text-primary-600' : item.color}`} />
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="sm:hidden text-xs">{item.label.split(' ')[0]}</span>
                  </button>
                );
              })}
              
              {/* Dropdown Admin */}
              {hasAdminAccess && (
                <div className="relative">
                  <button
                    onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                    className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      adminMenuItems.some(item => currentView === item.key)
                        ? 'bg-primary-100 text-primary-700 border border-primary-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Settings className={`h-3 w-3 sm:h-4 sm:w-4 ${
                      adminMenuItems.some(item => currentView === item.key) ? 'text-primary-600' : 'text-gray-600'
                    }`} />
                    <span className="hidden sm:inline">Admin</span>
                    <span className="sm:hidden text-xs">Admin</span>
                    <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform ${
                      showAdminDropdown ? 'rotate-180' : ''
                    }`} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showAdminDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      {adminMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.key}
                            onClick={() => {
                              setCurrentView(item.key as View);
                              setShowAdminDropdown(false);
                            }}
                            className={`w-full flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                              currentView === item.key
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <Icon className={`h-4 w-4 ${currentView === item.key ? 'text-primary-600' : item.color}`} />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
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
      <div className={`max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8 transition-all duration-300`}>
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