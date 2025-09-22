import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { usePrintConfig } from '../contexts/PrintConfigContext';
import { Prescription } from '../types';
import { PrescriptionForm } from './PrescriptionForm';
import { SocialWorkAutocomplete } from './SocialWorkAutocomplete';
import { Search, FileText, Calendar, User, Eye, Stethoscope, Edit3, Filter, X, Printer, Clock, CheckCircle, Square, CheckSquare } from 'lucide-react';
import { Download } from 'lucide-react';
import { printPrescriptionPDF, printPrescriptionPDF_A5, generateMultiplePrescriptionsPDF } from '../utils/pdfGenerator';
import { generateStatisticsReport } from '../utils/reportGenerator';
import { AlertTriangle } from 'lucide-react';
import { DateRangePicker } from './DateRangePicker';

// Componente Skeleton para la lista de recetas
const SkeletonPrescriptionCard = () => (
  <div className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors animate-pulse">
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2">
          <div className="h-6 w-16 bg-gray-200 rounded"></div>
          <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
          <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm mb-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-4 w-28 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        <div className="mt-3">
          <div className="h-4 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
      
      <div className="lg:ml-4">
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
          <div className="h-8 w-12 bg-gray-200 rounded-lg"></div>
          <div className="h-8 w-16 bg-gray-200 rounded-lg"></div>
          <div className="h-8 w-20 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  </div>
);

interface PrescriptionHistoryProps {
  onViewPrescription: (prescription: Prescription) => void;
  onEditPrescription: (prescription: Prescription) => void;
  onNewPrescription: () => void;
}

export default function PrescriptionHistory({ onViewPrescription, onEditPrescription, onNewPrescription }: PrescriptionHistoryProps) {
  const { prescriptions, updatePrescriptionAuthorization, loadingPrescriptions, loadPrescriptions, loadSocialWorks } = useData();
  const { isDoctor, hasPermission } = useAuth();
  const { printFormat } = usePrintConfig();
  const [selectedPrescriptions, setSelectedPrescriptions] = useState<Set<string>>(new Set());
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNumber, setFilterNumber] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterPatient, setFilterPatient] = useState('');
  const [filterDNI, setFilterDNI] = useState('');
  const [filterSocialWork, setFilterSocialWork] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAuthorization, setFilterAuthorization] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Cargar recetas cuando se monta el componente
  useEffect(() => {
    loadPrescriptions();
    loadSocialWorks();
  }, []);

  // Configurar suscripción en tiempo real para el historial de recetas
  useEffect(() => {
    // Cargar recetas cuando se monta el componente
    loadPrescriptions();
    loadSocialWorks();
  }, []);

  const typeLabels = {
    studies: 'Estudios',
    treatments: 'Tratamientos',
    surgery: 'Cirugías'
  };

  // Usar todas las prescripciones (modo público)
  const availablePrescriptions = prescriptions; // Las políticas RLS ya filtran automáticamente para médicos

  const filteredPrescriptions = availablePrescriptions.filter(prescription => {
    const matchesSearch = 
      prescription.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.patient.dni.includes(searchTerm) ||
      prescription.doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.number.toString().includes(searchTerm);
    
    const matchesNumber = !filterNumber || prescription.number.toString().includes(filterNumber);
    const matchesDoctor = !filterDoctor || prescription.doctor.name.toLowerCase().includes(filterDoctor.toLowerCase());
    const matchesPatient = !filterPatient || 
      prescription.patient.name.toLowerCase().includes(filterPatient.toLowerCase()) ||
      prescription.patient.lastName.toLowerCase().includes(filterPatient.toLowerCase());
    const matchesDNI = !filterDNI || prescription.patient.dni.includes(filterDNI);
    const matchesSocialWork = !filterSocialWork || 
      prescription.patient.socialWork.toLowerCase().includes(filterSocialWork.toLowerCase());
    
    const prescriptionDate = new Date(prescription.date);
    const matchesDateFrom = !filterDateFrom || prescriptionDate >= new Date(filterDateFrom + 'T00:00:00');
    const matchesDateTo = !filterDateTo || prescriptionDate <= new Date(filterDateTo + 'T23:59:59');
    
    const matchesAuthorization = filterAuthorization === 'all' || 
      (filterAuthorization === 'authorized' && prescription.authorized) ||
      (filterAuthorization === 'pending' && !prescription.authorized);
    
    // Filtrar por tipo basado en las categorías de prácticas que contiene la receta
    const matchesType = filterType === 'all' || (() => {
      const practiceCategories = [...new Set(prescription.items.map(item => item.practice.category))];
      switch (filterType) {
        case 'studies':
          return practiceCategories.includes('study');
        case 'treatments':
          return practiceCategories.includes('treatment');
        case 'authorization':
          return practiceCategories.includes('surgery');
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesNumber && matchesDoctor && matchesPatient && matchesDNI &&
           matchesSocialWork && matchesDateFrom && matchesDateTo && matchesType && matchesAuthorization;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterNumber('');
    setFilterDoctor('');
    setFilterPatient('');
    setFilterDNI('');
    setFilterSocialWork('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterType('all');
    setFilterAuthorization('all');
  };

  const hasActiveFilters = searchTerm || filterNumber || filterDoctor || filterPatient || 
                          filterDNI || filterSocialWork ||
                          filterDateFrom || filterDateTo || filterType !== 'all' || filterAuthorization !== 'all';

  const handlePrintPrescription = async (prescription: Prescription) => {
    try {
      if (printFormat === 'A5') {
        await printPrescriptionPDF_A5(prescription);
      } else {
        await printPrescriptionPDF(prescription);
      }
    } catch (error) {
      console.error('Error al imprimir receta:', error);
      setErrorMessage('Error al imprimir la receta. Por favor, intente nuevamente.');
      setShowErrorModal(true);
    }
  };

  const handleToggleAuthorization = async (prescription: Prescription) => {
    try {
      await updatePrescriptionAuthorization(prescription.id, !prescription.authorized);
    } catch (error) {
      console.error('Error al cambiar autorización:', error);
      setErrorMessage('Error al cambiar el estado de autorización. Por favor, intente nuevamente.');
      setShowErrorModal(true);
    }
  };

  const handleGenerateReport = async () => {
    try {
      // Preparar datos del reporte basados en los filtros actuales
      const reportData = {
        periodo: `Filtros aplicados - ${new Date().toLocaleDateString('es-AR')}`,
        totalRecetas: filteredPrescriptions.length,
        estadisticasPorDia: generateDailyStats(),
        estadisticasPorMedico: generateDoctorStats(),
        estadisticasPorPractica: generatePracticeStats(),
        estadisticasPorTipo: generateTypeStats()
      };
      
      await generateStatisticsReport(reportData);
    } catch (error) {
      console.error('Error generando reporte:', error);
      setErrorMessage('Error al generar el reporte. Por favor, intente nuevamente.');
      setShowErrorModal(true);
    }
  };

  // Funciones auxiliares para generar estadísticas del reporte
  const generateDailyStats = () => {
    const stats: { [key: string]: number } = {};
    
    filteredPrescriptions.forEach(prescription => {
      const date = prescription.date;
      stats[date] = (stats[date] || 0) + 1;
    });
    
    return Object.entries(stats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('es-AR'),
        count
      }));
  };

  const generateDoctorStats = () => {
    const stats: { [key: string]: number } = {};
    
    filteredPrescriptions.forEach(prescription => {
      const doctorName = prescription.doctor.name;
      stats[doctorName] = (stats[doctorName] || 0) + 1;
    });
    
    return Object.entries(stats)
      .sort(([, a], [, b]) => b - a)
      .map(([doctor, count]) => ({ doctor, count }));
  };

  const generatePracticeStats = () => {
    const stats: { [key: string]: { count: number; practice: any } } = {};
    
    filteredPrescriptions.forEach(prescription => {
      prescription.items.forEach(item => {
        const practiceId = item.practiceId;
        if (!stats[practiceId]) {
          stats[practiceId] = { count: 0, practice: item.practice };
        }
        stats[practiceId].count += 1;
      });
    });
    
    return Object.entries(stats)
      .sort(([, a], [, b]) => b.count - a.count)
      .map(([practiceId, { count, practice }]) => ({
        practice: practice.name,
        category: practice.category,
        count
      }));
  };

  const generateTypeStats = () => {
    const stats: { [key: string]: number } = {};
    
    filteredPrescriptions.forEach(prescription => {
      // Obtener todas las categorías únicas de las prácticas en esta receta
      const categories = [...new Set(prescription.items.map(item => item.practice.category))];
      categories.forEach(category => {
        const typeKey = category === 'study' ? 'Estudios' : 
                       category === 'treatment' ? 'Tratamientos' : 'Cirugías';
        stats[typeKey] = (stats[typeKey] || 0) + 1;
      });
    });
    
    return Object.entries(stats).map(([type, count]) => ({
      type,
      count
    }));
  };

  const handleSelectPrescription = (prescriptionId: string) => {
    setSelectedPrescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(prescriptionId)) {
        newSet.delete(prescriptionId);
      } else {
        newSet.add(prescriptionId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedPrescriptions.size === filteredPrescriptions.length) {
      // Si todas están seleccionadas, deseleccionar todas
      setSelectedPrescriptions(new Set());
    } else {
      // Seleccionar todas las visibles
      setSelectedPrescriptions(new Set(filteredPrescriptions.map(p => p.id)));
    }
  };

  const handleBatchPrint = async () => {
    if (selectedPrescriptions.size === 0) {
      setErrorMessage('Debe seleccionar al menos una receta para imprimir en lote.');
      setShowErrorModal(true);
      return;
    }

    try {
      const prescriptionsToProcess = filteredPrescriptions.filter(p => selectedPrescriptions.has(p.id));
      await generateMultiplePrescriptionsPDF(prescriptionsToProcess);
      // Limpiar selección después de imprimir
      setSelectedPrescriptions(new Set());
    } catch (error) {
      console.error('Error al imprimir lote:', error);
      setErrorMessage('Error al generar el PDF en lote. Por favor, intente nuevamente.');
      setShowErrorModal(true);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary-600" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Recetas
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
            title="Generar reporte con filtros actuales"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Generar Reporte</span>
            <span className="sm:hidden">Reporte</span>
          </button>
          <button
            onClick={onNewPrescription}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva Receta</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        </div>
      </div>

      {/* Búsqueda principal */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Búsqueda general..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title="Limpiar todos los filtros"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>
        )}
      </div>

      {/* Filtros siempre visibles */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Número de Receta
            </label>
            <input
              type="text"
              placeholder="Ej: 1234"
              value={filterNumber}
              onChange={(e) => setFilterNumber(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Médico
            </label>
            <input
              type="text"
              placeholder="Nombre del médico"
              value={filterDoctor}
              onChange={(e) => setFilterDoctor(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Paciente
            </label>
            <input
              type="text"
              placeholder="Nombre del paciente"
              value={filterPatient}
              onChange={(e) => setFilterPatient(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              DNI
            </label>
            <input
              type="text"
              placeholder="DNI del paciente"
              value={filterDNI}
              onChange={(e) => setFilterDNI(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <DateRangePicker
              startDate={filterDateFrom}
              endDate={filterDateTo}
              onDateChange={(start, end) => {
                setFilterDateFrom(start);
                setFilterDateTo(end);
              }}
            />
          </div>
          <div>
           <label className="block text-xs font-medium text-gray-600 mb-1">
             Obra Social
           </label>
            <SocialWorkAutocomplete
              value={filterSocialWork}
              onChange={(value) => setFilterSocialWork(value)}
              placeholder="Ej: OSDE, IOMA"
             label=""
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Estado de Autorización
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterAuthorization('all')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filterAuthorization === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilterAuthorization('authorized')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filterAuthorization === 'authorized'
                    ? 'bg-green-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Autorizadas
              </button>
              <button
                onClick={() => setFilterAuthorization('pending')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filterAuthorization === 'pending'
                    ? 'bg-orange-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Pendientes
              </button>
            </div>
          </div>
          
          <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Tipo de Prácticas
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filterType === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('studies')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filterType === 'studies'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Estudios
            </button>
            <button
              onClick={() => setFilterType('treatments')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filterType === 'treatments'
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Tratamientos
            </button>
            <button
              onClick={() => setFilterType('authorization')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filterType === 'authorization'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cirugías
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* Estadísticas basadas en filtros */}
      <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas del Período Seleccionado</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Días seleccionados */}
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">
              {(() => {
                if (!filterDateFrom || !filterDateTo) return '-';
                const startDate = new Date(filterDateFrom);
                const endDate = new Date(filterDateTo);
                const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                return diffDays;
              })()}
            </div>
            <div className="text-sm text-blue-600">Días Seleccionados</div>
          </div>

          {/* Recetas autorizadas */}
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">
              {filteredPrescriptions.filter(p => p.authorized).length}
            </div>
            <div className="text-sm text-green-600">Recetas Autorizadas</div>
          </div>

          {/* Recetas sin autorizar */}
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-700">
              {filteredPrescriptions.filter(p => !p.authorized).length}
            </div>
            <div className="text-sm text-orange-600">Recetas Sin Autorizar</div>
          </div>

          {/* Total estudios autorizados */}
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">
              {(() => {
                let total = 0;
                filteredPrescriptions
                  .filter(p => p.authorized)
                  .forEach(prescription => {
                    prescription.items.forEach(item => {
                      if (['study', 'treatment', 'surgery'].includes(item.practice.category)) {
                        total++;
                      }
                    });
                  });
                return total;
              })()}
            </div>
            <div className="text-sm text-purple-600">Estudios Autorizados</div>
          </div>

          {/* Total estudios sin autorizar */}
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-700">
              {(() => {
                let total = 0;
                filteredPrescriptions
                  .filter(p => !p.authorized)
                  .forEach(prescription => {
                    prescription.items.forEach(item => {
                      if (['study', 'treatment', 'surgery'].includes(item.practice.category)) {
                        total++;
                      }
                    });
                  });
                return total;
              })()}
            </div>
            <div className="text-sm text-red-600">Estudios Sin Autorizar</div>
          </div>
        </div>
      </div>

      {/* Controles de selección en lote - Solo para formato A4 */}
      {printFormat === 'A4' && filteredPrescriptions.length > 0 && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <input
              type="checkbox"
              checked={selectedPrescriptions.size === filteredPrescriptions.length && filteredPrescriptions.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            Seleccionar todas ({filteredPrescriptions.length})
          </label>
          
          {selectedPrescriptions.size > 0 && (
            <button
              onClick={handleBatchPrint}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              <Printer className="h-4 w-4" />
              Imprimir Lote ({selectedPrescriptions.size})
            </button>
          )}
        </div>
      )}

      {/* Lista de recetas */}
      <div className="space-y-4">
        {loadingPrescriptions ? (
          // Mostrar skeletons mientras carga
          [...Array(5)].map((_, index) => (
            <SkeletonPrescriptionCard key={index} />
          ))
        ) : filteredPrescriptions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              No se encontraron recetas
            </p>
            <p className="text-gray-400">
              {searchTerm || filterType !== 'all' 
                ? 'Intente ajustar los filtros de búsqueda'
                : 'Aún no hay recetas creadas'
              }
            </p>
          </div>
        ) : (
          filteredPrescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className={`border rounded-lg p-3 sm:p-4 transition-colors ${(() => {
                if (prescription.authorized) {
                  return 'border-gray-200 hover:bg-gray-50';
                }
                
                // Calcular tiempo transcurrido para recetas no autorizadas
                const createdDate = new Date(prescription.createdAt);
                const now = new Date();
                const diffMs = now.getTime() - createdDate.getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                
                if (diffDays >= 5) {
                  return 'border-red-200 bg-red-50 hover:bg-red-100';
                } else if (diffDays >= 1) {
                  return 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100';
                } else {
                  return 'border-gray-200 hover:bg-gray-50';
                }
              })()}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Checkbox para selección en lote - Solo para formato A4 */}
                {printFormat === 'A4' && (
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleSelectPrescription(prescription.id)}
                      className="mr-3 p-1 rounded hover:bg-gray-100 transition-colors"
                      title={selectedPrescriptions.has(prescription.id) ? 'Deseleccionar receta' : 'Seleccionar receta'}
                    >
                      {selectedPrescriptions.has(prescription.id) ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2">
                    <div className="text-base sm:text-lg font-semibold text-primary-700">
                      #{prescription.number}
                    </div>
                    {(() => {
                      // Obtener todas las categorías únicas de las prácticas en esta receta
                      const categories = [...new Set(prescription.items.map(item => item.practice.category))];
                      const categoryLabels = {
                        study: 'Estudios',
                        treatment: 'Tratamientos', 
                        surgery: 'Cirugías'
                      };
                      const categoryColors = {
                        study: 'bg-blue-100 text-blue-800',
                        treatment: 'bg-green-100 text-green-800',
                        surgery: 'bg-purple-100 text-purple-800'
                      };
                      
                      return categories.map(category => (
                        <div key={category} className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[category as keyof typeof categoryColors]}`}>
                          {categoryLabels[category as keyof typeof categoryLabels]}
                        </div>
                      ));
                    })()}
                    {/* Indicador de tiempo para recetas no autorizadas */}
                    {!prescription.authorized && (() => {
                      const createdDate = new Date(prescription.createdAt);
                      const now = new Date();
                      const diffMs = now.getTime() - createdDate.getTime();
                      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                      const diffMonths = Math.floor(diffDays / 30);
                      
                      let timeText = '';
                      let colorClass = '';
                      
                      if (diffMonths >= 1) {
                        timeText = `${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'} desde emisión`;
                        colorClass = 'text-red-600'; // Más de 5 días = rojo
                      } else if (diffDays >= 5) {
                        timeText = `${diffDays} días desde emisión`;
                        colorClass = 'text-red-600'; // Más de 5 días = rojo
                      } else if (diffDays >= 1) {
                        timeText = `${diffDays} ${diffDays === 1 ? 'día' : 'días'} desde emisión`;
                        colorClass = 'text-yellow-600'; // Menos de 5 días = amarillo
                      } else {
                        timeText = `${diffHours} hs desde emisión`;
                        colorClass = 'text-gray-600'; // Horas = gris
                      }
                      
                      return (
                        <div className={`text-xs font-bold ${colorClass}`}>
                          {timeText}
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>
                        <strong>Paciente:</strong> {prescription.patient.name} {prescription.patient.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>
                        <strong>DNI:</strong> {prescription.patient.dni}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      <span>
                        <strong>Médico:</strong> {prescription.doctor.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        <strong>Fecha:</strong> {new Date(prescription.date).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="text-xs sm:text-sm text-gray-700">
                      <strong>Prácticas ({prescription.items.length}):</strong>
                      <span className="ml-2">
                        {prescription.items.slice(0, 3).map(item => item.practice.name).join(', ')}
                        {prescription.items.length > 3 && ` y ${prescription.items.length - 3} más...`}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="lg:ml-4">
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    {/* Estado de autorización */}
                    {prescription.authorized ? (
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle className="h-3 w-3" />
                        <span>Autorizado</span>
                      </div>
                    ) : (
                      // Solo admin y secretary pueden autorizar recetas
                      hasPermission('manage_prescriptions') && !isDoctor ? (
                        <button
                          onClick={() => handleToggleAuthorization(prescription)}
                          className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-colors"
                          title="Autorizar receta"
                        >
                          <Clock className="h-3 w-3" />
                          <span>Autorizar</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                          <Clock className="h-3 w-3" />
                          <span>Pendiente</span>
                        </div>
                      )
                    )}
                    <button
                      onClick={() => onViewPrescription(prescription)}
                      className="flex items-center gap-1 px-2 sm:px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">Ver</span>
                    </button>
                    {/* Solo mostrar botón de editar si el usuario tiene permisos */}
                    {(hasPermission('manage_prescriptions') || isDoctor) && (
                      <button
                        onClick={() => onEditPrescription(prescription)}
                        className="flex items-center gap-1 px-2 sm:px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>
                    )}
                    <button
                      onClick={() => handlePrintPrescription(prescription)}
                      className="flex items-center gap-1 px-2 sm:px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      title="Imprimir receta"
                    >
                      <Printer className="h-4 w-4" />
                      <span className="hidden sm:inline">Imprimir</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {!loadingPrescriptions && filteredPrescriptions.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Mostrando {filteredPrescriptions.length} de {availablePrescriptions.length} recetas
          {hasActiveFilters && (
            <span className="ml-2 text-primary-600">
              (filtradas)
            </span>
          )}
        </div>
      )}
      {/* Controles de selección en lote - Solo para formato A4 */}
      {printFormat === 'A4' && filteredPrescriptions.length > 0 && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-3">

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