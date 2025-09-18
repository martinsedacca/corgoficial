import React, { useState } from 'react';
import { DataProvider } from './contexts/DataContext';
import { useData } from './contexts/DataContext';
import { PrescriptionForm } from './components/PrescriptionForm';
import { PrescriptionViewer } from './components/PrescriptionViewer';
import PrescriptionHistory from './components/PrescriptionHistory';
import { DoctorManager } from './components/DoctorManager';
import { PatientManager } from './components/PatientManager';
import { PracticeManager } from './components/PracticeManager';
import { PracticeAdmin } from './components/PracticeAdmin';
import { SocialWorkManager } from './components/SocialWorkManager';
import { Dashboard } from './components/Dashboard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { Prescription } from './types';
import { FileText, History, User, Users, Activity, Stethoscope, Download, Building2, BarChart3 } from 'lucide-react';

type View = 'dashboard' | 'new' | 'history' | 'doctors' | 'patients' | 'practices' | 'admin-practices' | 'social-works';

function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

function AppContent() {
  const { loading, error, refreshData } = useData();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);

  const handlePrescriptionSubmit = (prescriptionData: any) => {
    // La receta ya se guardó en PrescriptionForm, solo cambiamos la vista
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

  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'text-blue-600' },
    { key: 'new', label: 'Nueva Receta', icon: FileText, color: 'text-primary-600' },
    { key: 'history', label: 'Historial', icon: History, color: 'text-gray-600' },
    { key: 'doctors', label: 'Médicos', icon: User, color: 'text-primary-600' },
    { key: 'patients', label: 'Pacientes', icon: Users, color: 'text-green-600' },
    { key: 'admin-practices', label: 'Administrar Prácticas', icon: Activity, color: 'text-purple-600' },
    { key: 'social-works', label: 'Obras Sociales', icon: Building2, color: 'text-blue-600' }
  ];

  // Mostrar loading mientras se cargan los datos
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="mb-8">
          <img 
            src="/Logo-corg.png" 
            alt="CORG Logo" 
            className="h-20 w-auto"
          />
        </div>
        <LoadingSpinner size="lg" text="Cargando" />
      </div>
    );
  }

  // Mostrar error si hay problemas de conexión
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ErrorMessage 
            message={`Error de conexión con Supabase: ${error}`}
            onRetry={refreshData}
          />
        </div>
      </div>
    );
  }

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
            <div className="flex items-center space-x-2">
              <img 
                src="/Logo-corg.png" 
                alt="CORG Logo" 
                className="h-8 sm:h-10 w-auto"
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1 mt-2 sm:mt-0 sm:space-x-1">
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
                    <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${currentView === item.key ? 'text-primary-600' : currentView === item.key ? 'text-primary-600' : item.color.replace('blue', 'primary')}`} />
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="sm:hidden text-xs">{item.label.split(' ')[0]}</span>
                  </button>
                );
              })}
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
          />
        )}
        {currentView === 'doctors' && <DoctorManager />}
        {currentView === 'patients' && <PatientManager />}
        {currentView === 'admin-practices' && <PracticeAdmin />}
        {currentView === 'social-works' && <SocialWorkManager />}
      </div>
    </div>
  );
}

export default App;