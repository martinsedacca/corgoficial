import React from 'react';
import { useState, useMemo } from 'react';
import { useEffect } from 'react';
import { Prescription } from '../types';
import { companyInfo } from '../data/mockData';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { usePrintConfig } from '../contexts/PrintConfigContext';
import { SocialWorkAutocomplete } from './SocialWorkAutocomplete';
import { SocialWorkPlanSelector } from './SocialWorkPlanSelector';
import { Calendar, User, Stethoscope, FileText, Download, Printer, Clock, CheckCircle, Edit3, X, Save } from 'lucide-react';
import { generatePrescriptionPDF, printPrescriptionPDF, generatePrescriptionPDF_A5, printPrescriptionPDF_A5 } from '../utils/pdfGenerator';
import { AlertTriangle } from 'lucide-react';

interface PrescriptionViewerProps {
  prescription: Prescription;
}

export function PrescriptionViewer({ prescription }: PrescriptionViewerProps) {
  const { updatePrescriptionAuthorization, prescriptions, updatePatient, socialWorks, getSocialWorkPlans } = useData();
  const { isDoctor, hasPermission } = useAuth();
  const { printFormat } = usePrintConfig();
  const [showDeauthorizeModal, setShowDeauthorizeModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(false);
  const [selectedSocialWorkForEdit, setSelectedSocialWorkForEdit] = useState<any>(null);
  const [patientFormData, setPatientFormData] = useState({
    name: '',
    lastName: '',
    dni: '',
    socialWork: '',
    affiliateNumber: '',
    plan: '',
    phone: '',
    email: '',
    address: ''
  });
  // Obtener la receta actualizada del contexto para reactividad
  const currentPrescription = useMemo(() => {
    return prescriptions.find(p => p.id === prescription.id) || prescription;
  }, [prescriptions, prescription.id, prescription]);

  // Configurar suscripción en tiempo real para esta receta específica
  useEffect(() => {
    // El viewer ahora usa el sistema de notificaciones global
    // en lugar de suscripciones automáticas
  }, []);
  
  const typeLabels = {
    studies: 'Autorización de Estudios',
    treatments: 'Autorización de Tratamientos',
    surgery: 'Autorización de Cirugía'
  };

  const handleExportPDF = async () => {
    try {
      if (printFormat === 'A5') {
        await generatePrescriptionPDF_A5(currentPrescription);
      } else {
        await generatePrescriptionPDF(currentPrescription);
      }
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      setErrorMessage('Error al exportar el PDF. Por favor, intente nuevamente.');
      setShowErrorModal(true);
    }
  };

  const handlePrintPDF = async () => {
    try {
      if (printFormat === 'A5') {
        await printPrescriptionPDF_A5(currentPrescription);
      } else {
        await printPrescriptionPDF(currentPrescription);
      }
    } catch (error) {
      console.error('Error al imprimir PDF:', error);
      setErrorMessage('Error al imprimir el PDF. Por favor, intente nuevamente.');
      setShowErrorModal(true);
    }
  };

  const handleAuthorize = async () => {
    try {
      await updatePrescriptionAuthorization(currentPrescription.id, true);
    } catch (error) {
      console.error('Error al cambiar autorización:', error);
      setErrorMessage('Error al cambiar el estado de autorización. Por favor, intente nuevamente.');
      setShowErrorModal(true);
    }
  };

  const handleDeauthorize = async () => {
    try {
      await updatePrescriptionAuthorization(currentPrescription.id, false);
      setShowDeauthorizeModal(false);
    } catch (error) {
      console.error('Error al desautorizar:', error);
      setShowDeauthorizeModal(false);
      setErrorMessage('Error al desautorizar la receta. Por favor, intente nuevamente.');
      setShowErrorModal(true);
    }
  };

  const handleEditPatient = () => {
    const socialWork = socialWorks.find(sw => sw.name === currentPrescription.patient.socialWork);
    console.log('Found social work:', socialWork);
    console.log('Available plans for this social work:', socialWork ? getSocialWorkPlans(socialWork.id) : []);
    setSelectedSocialWorkForEdit(socialWork || null);
    setPatientFormData({
      name: currentPrescription.patient.name,
      lastName: currentPrescription.patient.lastName,
      dni: currentPrescription.patient.dni,
      socialWork: currentPrescription.patient.socialWork,
      affiliateNumber: currentPrescription.patient.affiliateNumber || '',
      plan: currentPrescription.patient.plan || '',
      phone: currentPrescription.patient.phone || '',
      email: currentPrescription.patient.email || '',
      address: currentPrescription.patient.address || ''
    });
    setShowEditPatientModal(true);
  };

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditingPatient(true);
    
    try {
      await updatePatient(currentPrescription.patient.id, patientFormData);
      setShowEditPatientModal(false);
      // La actualización es reactiva a través del contexto de datos
      // No necesitamos recargar manualmente la página
      console.error('Error updating patient:', error);
      setErrorMessage('Error al actualizar los datos del paciente. Por favor, intente nuevamente.');
      setShowErrorModal(true);
    } finally {
      setEditingPatient(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 max-w-4xl mx-auto relative">
      {/* Export Button - Moved to top */}
      <div className="mb-6 text-center">
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-primary-50 text-primary-700 border-2 border-primary-300 px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-medium hover:bg-primary-100 hover:border-primary-400 transition-colors text-sm sm:text-base"
          >
            <Download className="h-5 w-5" />
            Descargar PDF
          </button>
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-2 bg-primary-50 text-primary-700 border-2 border-primary-300 px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-medium hover:bg-primary-100 hover:border-primary-400 transition-colors text-sm sm:text-base"
          >
            <Printer className="h-5 w-5" />
            Imprimir
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-6 sm:mb-8 pb-4 sm:pb-6 border-b-2 border-primary-900">
        <div className="mb-4">
          <div className="flex justify-center mb-4">
            <img 
              src="/Logo-corg.png" 
              alt="CORG Logo" 
              className="h-12 sm:h-16 w-auto"
            />
          </div>
          <div className="text-base sm:text-lg font-medium text-gray-600 mb-1">
            {companyInfo.subtitle}
          </div>
          <div className="text-sm text-gray-600">
            DIRECTOR MÉDICO
          </div>
          <div className="text-sm font-medium text-gray-800">
            {companyInfo.director}
          </div>
          <div className="text-sm text-gray-600">
            {companyInfo.license}
          </div>
        </div>
      </div>

      {/* Prescription Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <div className="space-y-1">
          <div className="text-sm text-gray-600">Receta N°:</div>
          <div className="text-base sm:text-lg font-bold text-primary-900">#{currentPrescription.number}</div>
        </div>
        <div className="space-y-1 sm:text-right">
          <div className="text-sm text-gray-600">Fecha:</div>
          <div className="text-base sm:text-lg font-semibold">{new Date(currentPrescription.date).toLocaleDateString('es-AR')}</div>
        </div>
      </div>

      {/* Authorization Status */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            currentPrescription.authorized 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-gray-100 text-gray-600 border border-gray-200'
          }`}>
            {currentPrescription.authorized ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Estado: Autorizado
              </>
            ) : (
              <>
                <Clock className="h-4 w-4" />
                Estado: Pendiente de Autorización
              </>
            )}
          </div>
          
          {/* Botones de autorización */}
          {/* Solo admin y secretary pueden cambiar el estado de autorización */}
          {hasPermission('manage_prescriptions') && !isDoctor && (
            !currentPrescription.authorized ? (
              <button
                onClick={handleAuthorize}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 transition-colors"
              >
                Autorizar
              </button>
            ) : (
              <button
                onClick={() => setShowDeauthorizeModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 transition-colors"
              >
                Desautorizar
              </button>
            )
          )}
        </div>
      </div>

      {/* Patient Info */}
      <div className="mb-6">
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg relative">
          {/* Botón de editar paciente */}
          {hasPermission('manage_patients') && (
            <button
              onClick={handleEditPatient}
              className="absolute top-3 right-3 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar datos del paciente"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          )}
          <div className="text-sm font-medium text-gray-600 mb-2">Datos del Paciente:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <div>
              <span className="text-sm text-gray-600">Nombre y Apellido: </span>
              <span className="font-medium">{currentPrescription.patient.name} {currentPrescription.patient.lastName}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Obra Social: </span>
              <span className="font-medium">{currentPrescription.patient.socialWork}{currentPrescription.patient.plan ? ` - ${currentPrescription.patient.plan}` : ''}</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">N° Afiliado: </span>
            <span className="font-medium">{currentPrescription.patient.affiliateNumber}</span>
          </div>
        </div>
      </div>

      {/* Practices */}
      <div className="mb-6">
        <div className="text-sm font-medium text-gray-600 mb-3">Solicito:</div>
        <div className="space-y-3">
          {currentPrescription.items.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 mb-1">
                    ✓ {item.practice.name}
                  </div>
                  {item.notes && (
                    <div className="text-sm text-gray-600 mt-1">
                      {item.notes}
                    </div>
                  )}
                </div>
                <div className="text-sm font-medium text-primary-700 sm:ml-4">
                  {item.ao}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Notes */}
      {currentPrescription.additionalNotes && (
        <div className="mb-6">
          <div className="text-sm font-medium text-gray-600 mb-2">Observaciones:</div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs sm:text-sm">
            {currentPrescription.additionalNotes}
          </div>
        </div>
      )}

      {/* Doctor Info */}
      <div className="mb-8">
        <div className="text-sm font-medium text-gray-600 mb-2">Médico:</div>
        <div className="text-base sm:text-lg font-semibold">{currentPrescription.doctor.name}</div>
        <div className="text-sm text-gray-600">{currentPrescription.doctor.specialty} - {currentPrescription.doctor.license}</div>
      </div>

      {/* Signature Area */}
      <div className="grid grid-cols-2 gap-4 sm:gap-8 mb-8">
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2 text-sm text-gray-600">
            FECHA
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2 text-sm text-gray-600">
            FIRMA Y SELLO
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-primary-900 text-white p-3 sm:p-4 rounded-lg text-xs sm:text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                <span className="text-primary-900 text-xs">📍</span>
              </div>
              <span>{companyInfo.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                <span className="text-primary-900 text-xs">📞</span>
              </div>
              <span>Turnos al Tel.: {companyInfo.phone1}/{companyInfo.phone2}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                <span className="text-primary-900 text-xs">📱</span>
              </div>
              <span>WhatsApp: {companyInfo.whatsapp}</span>
            </div>
          </div>
          <div className="space-y-1 sm:text-right">
            <div className="flex items-center justify-end gap-2">
              <span>{companyInfo.social}</span>
              <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                <span className="text-primary-900 text-xs">📘</span>
              </div>
              <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                <span className="text-primary-900 text-xs">📷</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <span>{companyInfo.location}</span>
              <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                <span className="text-primary-900 text-xs">📍</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación de desautorización */}
      {showDeauthorizeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirmar Desautorización
              </h3>
              <p className="text-gray-600 mb-6">
                ¿Está seguro que desea desautorizar esta receta?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeauthorizeModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeauthorize}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Desautorizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de paciente */}
      {showEditPatientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Editar Datos del Paciente
              </h3>
              <button
                onClick={() => setShowEditPatientModal(false)}
                disabled={editingPatient}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSavePatient} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={patientFormData.name}
                    onChange={(e) => setPatientFormData({...patientFormData, name: e.target.value})}
                    disabled={editingPatient}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="Juan Carlos"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={patientFormData.lastName}
                    onChange={(e) => setPatientFormData({...patientFormData, lastName: e.target.value})}
                    disabled={editingPatient}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="Martínez"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DNI *
                  </label>
                  <input
                    type="text"
                    required
                    value={patientFormData.dni}
                    onChange={(e) => {
                      const newDni = e.target.value.replace(/\D/g, '');
                      setPatientFormData({...patientFormData, dni: newDni});
                    }}
                    disabled={editingPatient}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="12345678"
                    pattern="[0-9]{4,}"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DNI *
                  </label>
                  <input
                    type="text"
                    required
                    value={patientFormData.dni}
                    onChange={(e) => {
                      const newDni = e.target.value.replace(/\D/g, '');
                      setPatientFormData({...patientFormData, dni: newDni});
                    }}
                    disabled={editingPatient}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                    placeholder="12345678"
                    pattern="[0-9]{4,}"
                  />
                </div>
                <div>
                  <SocialWorkAutocomplete
                    value={patientFormData.socialWork}
                    onChange={(value) => {
                      setPatientFormData({...patientFormData, socialWork: value, plan: ''});
                      const socialWork = socialWorks.find(sw => sw.name === value);
                      setSelectedSocialWorkForEdit(socialWork || null);
                    }}
                    disabled={editingPatient}
                    required
                  />
                </div>
                <div>
                  <SocialWorkPlanSelector
                    selectedSocialWork={selectedSocialWorkForEdit}
                    value={patientFormData.plan}
                    onChange={(value) => setPatientFormData({...patientFormData, plan: value})}
                    disabled={editingPatient}
                    placeholder="Seleccionar plan..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Afiliado
                  </label>
                  <input
                    type="text"
                    value={patientFormData.affiliateNumber}
                    onChange={(e) => setPatientFormData({...patientFormData, affiliateNumber: e.target.value})}
                    disabled={editingPatient}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                    placeholder="123456789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={patientFormData.phone}
                    onChange={(e) => setPatientFormData({...patientFormData, phone: e.target.value})}
                    disabled={editingPatient}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                    placeholder="2966 123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={patientFormData.email}
                    onChange={(e) => setPatientFormData({...patientFormData, email: e.target.value})}
                    disabled={editingPatient}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                    placeholder="paciente@email.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={patientFormData.address}
                    onChange={(e) => setPatientFormData({...patientFormData, address: e.target.value})}
                    disabled={editingPatient}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                    placeholder="Av. Kirchner 456"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={editingPatient}
                  className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingPatient ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Guardar Cambios
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditPatientModal(false)}
                  disabled={editingPatient}
                  className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de error */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Error
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                {errorMessage}
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}