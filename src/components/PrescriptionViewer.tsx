import React from 'react';
import { Prescription } from '../types';
import { companyInfo } from '../data/mockData';
import { Calendar, User, Stethoscope, FileText, Download } from 'lucide-react';
import { generatePrescriptionPDF } from '../utils/pdfGenerator';

interface PrescriptionViewerProps {
  prescription: Prescription;
}

export function PrescriptionViewer({ prescription }: PrescriptionViewerProps) {
  const typeLabels = {
    studies: 'Autorización de Estudios',
    treatments: 'Autorización de Tratamientos',
    authorization: 'Autorización de Cirugía'
  };

  const handleExportPDF = async () => {
    try {
      await generatePrescriptionPDF(prescription);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('Error al exportar el PDF. Por favor, intente nuevamente.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 max-w-4xl mx-auto">
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
          <div className="text-base sm:text-lg font-bold text-primary-900">#{prescription.number}</div>
        </div>
        <div className="space-y-1 sm:text-right">
          <div className="text-sm text-gray-600">Fecha:</div>
          <div className="text-base sm:text-lg font-semibold">{new Date(prescription.date).toLocaleDateString('es-AR')}</div>
        </div>
      </div>

      {/* Type */}
      <div className="mb-6">
        <div className="bg-primary-50 border-l-4 border-primary-500 p-3 sm:p-4 rounded-lg">
          <div className="text-base sm:text-lg font-semibold text-primary-800">
            {typeLabels[prescription.type]}
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
              <span className="font-medium">{prescription.patient.name}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Obra Social: </span>
              <span className="font-medium">
                {prescription.patient.socialWork}{prescription.patient.plan ? ` - ${prescription.patient.plan}` : ''}
              </span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">N° Afiliado: </span>
            <span className="font-medium">{prescription.patient.affiliateNumber}</span>
          </div>
        </div>
      </div>

      {/* Practices */}
      <div className="mb-6">
        <div className="text-sm font-medium text-gray-600 mb-3">Solicito:</div>
        <div className="space-y-3">
          {prescription.items.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 mb-1">
                    ✓ {item.practice.name}
                  </div>
                  {item.notes && (
                        {prescription.patient.socialWork}
                        {prescription.patient.plan && prescription.patient.plan.trim() !== '' ? ` - ${prescription.patient.plan}` : ''}
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
      {prescription.additionalNotes && (
        <div className="mb-6">
          <div className="text-sm font-medium text-gray-600 mb-2">Observaciones:</div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs sm:text-sm">
            {prescription.additionalNotes}
          </div>
        </div>
      )}

      {/* Doctor Info */}
      <div className="mb-8">
        <div className="text-sm font-medium text-gray-600 mb-2">Médico:</div>
        <div className="text-base sm:text-lg font-semibold">{prescription.doctor.name}</div>
        <div className="text-sm text-gray-600">{prescription.doctor.specialty} - {prescription.doctor.license}</div>
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

      {/* Export Button */}
      <div className="mt-6 text-center">
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 bg-green-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-medium hover:bg-green-700 transition-colors mx-auto text-sm sm:text-base"
        >
          <Download className="h-5 w-5" />
          Exportar a PDF
        </button>
      </div>
    </div>
  );
}