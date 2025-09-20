import React from 'react';
import { useState, useMemo } from 'react';
import { Prescription } from '../types';
import { companyInfo } from '../data/mockData';
import { useData } from '../contexts/DataContext';
import { Calendar, User, Stethoscope, FileText, Download, Printer, Clock, CheckCircle } from 'lucide-react';
import { generatePrescriptionPDF, printPrescriptionPDF } from '../utils/pdfGenerator';

interface PrescriptionViewerProps {
  prescription: Prescription;
}

export function PrescriptionViewer({ prescription }: PrescriptionViewerProps) {
  const { updatePrescriptionAuthorization, prescriptions } = useData();
  const [showDeauthorizeModal, setShowDeauthorizeModal] = useState(false);
  
  // Obtener la receta actualizada del contexto para reactividad
  const currentPrescription = useMemo(() => {
    return prescriptions.find(p => p.id === prescription.id) || prescription;
  }, [prescriptions, prescription.id, prescription]);
  
  const typeLabels = {
    studies: 'Autorización de Estudios',
    treatments: 'Autorización de Tratamientos',
    authorization: 'Autorización de Cirugía'
  };

  const handleExportPDF = async () => {
    try {
      await generatePrescriptionPDF(currentPrescription);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('Error al exportar el PDF. Por favor, intente nuevamente.');
    }
  };

  const handlePrintPDF = async () => {
    try {
      await printPrescriptionPDF(currentPrescription);
    } catch (error) {
      console.error('Error al imprimir PDF:', error);
      alert('Error al imprimir el PDF. Por favor, intente nuevamente.');
    }
  };

  const handleAuthorize = async () => {
    try {
      await updatePrescriptionAuthorization(currentPrescription.id, true);
    } catch (error) {
      console.error('Error al cambiar autorización:', error);
      alert('Error al cambiar el estado de autorización. Por favor, intente nuevamente.');
    }
  };

  const handleDeauthorize = async () => {
    try {
      await updatePrescriptionAuthorization(currentPrescription.id, false);
      setShowDeauthorizeModal(false);
    } catch (error) {
      console.error('Error al desautorizar:', error);
      alert('Error al desautorizar la receta. Por favor, intente nuevamente.');
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
          {!currentPrescription.authorized ? (
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
          )}
        </div>
      </div>

      {/* Type */}
      <div className="mb-6">
        <div className="bg-primary-50 border-l-4 border-primary-500 p-3 sm:p-4 rounded-lg">
          <div className="text-base sm:text-lg font-semibold text-primary-800">
            {typeLabels[currentPrescription.type]}
          </div>
        </div>
      </div>

      {/* Patient Info */}
      <div className="mb-6">
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
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
            <span className="text-sm text-gray-600 ml-4">Plan: </span>
            <span className="font-medium">{currentPrescription.patient.plan || 'Sin plan'}</span>
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
    </div>
  );
}