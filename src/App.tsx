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
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { Prescription } from './types';
import { FileText, History, User, Users, Activity, Stethoscope, Download } from 'lucide-react';

type View = 'new' | 'history' | 'doctors' | 'patients' | 'practices' | 'admin-practices';

function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

function AppContent() {
  const { loading, error, refreshData } = useData();
  const [currentView, setCurrentView] = useState<View>('new');
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
    { key: 'new', label: 'Nueva Receta', icon: FileText, color: 'text-blue-600' },
    { key: 'history', label: 'Historial', icon: History, color: 'text-gray-600' },
    { key: 'doctors', label: 'Médicos', icon: User, color: 'text-blue-600' },
    { key: 'patients', label: 'Pacientes', icon: Users, color: 'text-green-600' },
    { key: 'admin-practices', label: 'Administrar Prácticas', icon: Activity, color: 'text-purple-600' }
  ];

  // Mostrar loading mientras se cargan los datos
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando datos desde Supabase..." />
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
              className="text-blue-600 hover:text-blue-800 font-medium"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Stethoscope className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-blue-700">CORG</h1>
                  <p className="text-xs text-gray-500">Sistema de Recetas Médicas</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => setCurrentView(item.key as View)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentView === item.key
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${currentView === item.key ? 'text-blue-600' : item.color}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </div>
    </div>
  );
}

export default App;