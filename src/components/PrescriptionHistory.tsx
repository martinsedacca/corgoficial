import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Prescription } from '../types';
import { PrescriptionForm } from './PrescriptionForm';
import { Search, FileText, Calendar, User, Eye, Stethoscope, Edit3, Filter, X } from 'lucide-react';

interface PrescriptionHistoryProps {
  onViewPrescription: (prescription: Prescription) => void;
  onEditPrescription: (prescription: Prescription) => void;
  onNewPrescription: () => void;
}

export default function PrescriptionHistory({ onViewPrescription, onEditPrescription, onNewPrescription }: PrescriptionHistoryProps) {
  const { prescriptions } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNumber, setFilterNumber] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterPatient, setFilterPatient] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const typeLabels = {
    studies: 'Estudios',
    treatments: 'Tratamientos',
    authorization: 'Autorización'
  };

  // Usar todas las prescripciones (modo público)
  const availablePrescriptions = prescriptions;

  const filteredPrescriptions = availablePrescriptions.filter(prescription => {
    const matchesSearch = 
      prescription.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.number.toString().includes(searchTerm);
    
    const matchesNumber = !filterNumber || prescription.number.toString().includes(filterNumber);
    const matchesDoctor = !filterDoctor || prescription.doctor.name.toLowerCase().includes(filterDoctor.toLowerCase());
    const matchesPatient = !filterPatient || prescription.patient.name.toLowerCase().includes(filterPatient.toLowerCase());
    
    const prescriptionDate = new Date(prescription.date);
    const matchesDateFrom = !filterDateFrom || prescriptionDate >= new Date(filterDateFrom + 'T00:00:00');
    const matchesDateTo = !filterDateTo || prescriptionDate <= new Date(filterDateTo + 'T23:59:59');
    
    const matchesType = filterType === 'all' || prescription.type === filterType;
    
    return matchesSearch && matchesNumber && matchesDoctor && matchesPatient && 
           matchesDateFrom && matchesDateTo && matchesType;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterNumber('');
    setFilterDoctor('');
    setFilterPatient('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterType('all');
  };

  const hasActiveFilters = searchTerm || filterNumber || filterDoctor || filterPatient || 
                          filterDateFrom || filterDateTo || filterType !== 'all';

  return (
    <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary-600" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Recetas
          </h2>
        </div>
        <button
          onClick={onNewPrescription}
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
        >
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Nueva Receta</span>
          <span className="sm:hidden">Nueva</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showAdvancedFilters || hasActiveFilters
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
            {hasActiveFilters && (
              <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                {[searchTerm, filterNumber, filterDoctor, filterPatient, filterDateFrom, filterDateTo, filterType !== 'all' ? '1' : ''].filter(Boolean).length}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              title="Limpiar todos los filtros"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filtros Avanzados */}
      {showAdvancedFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Filtros Avanzados</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
                Fecha Desde
              </label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tipo de Receta
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
                    ? 'bg-primary-600 text-white'
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
                Autorización
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selector de tipo (versión compacta cuando filtros avanzados están ocultos) */}
      {!showAdvancedFilters && (
        <div className="mb-6">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">Todos los tipos</option>
            <option value="studies">Estudios</option>
            <option value="treatments">Tratamientos</option>
            <option value="authorization">Autorización</option>
          </select>
        </div>
      )}

      {/* Lista de recetas */}
      <div className="space-y-4">
        {filteredPrescriptions.length === 0 ? (
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
              className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2">
                    <div className="text-base sm:text-lg font-semibold text-primary-700">
                      #{prescription.number}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      prescription.type === 'studies' 
                        ? 'bg-primary-100 text-primary-800'
                        : prescription.type === 'treatments'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {typeLabels[prescription.type]}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>
                        <strong>Paciente:</strong> {prescription.patient.name} {prescription.patient.lastName}
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
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <button
                      onClick={() => onViewPrescription(prescription)}
                      className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">Ver</span>
                    </button>
                    <button
                      onClick={() => onEditPrescription(prescription)}
                      className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span className="hidden sm:inline">Editar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {filteredPrescriptions.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Mostrando {filteredPrescriptions.length} de {availablePrescriptions.length} recetas
          {hasActiveFilters && (
            <span className="ml-2 text-primary-600">
              (filtradas)
            </span>
          )}
        </div>
      )}
    </div>
  );
}