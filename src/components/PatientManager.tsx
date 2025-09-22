import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { supabase } from '../lib/supabase';
import { Patient } from '../types';
import { SocialWorkAutocomplete } from './SocialWorkAutocomplete';
import { SocialWorkPlanSelector } from './SocialWorkPlanSelector';
import { UserPlus, Edit3, Trash2, Users, Phone, Mail, MapPin, Search, Filter, X, AlertTriangle, Plus } from 'lucide-react';

// Componente Skeleton para la lista de pacientes
const SkeletonPatientCard = () => (
  <div className="border border-gray-200 rounded-lg p-3 sm:p-4 animate-pulse">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-5 w-40 bg-gray-200 rounded"></div>
          <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 text-sm">
          <div className="space-y-1">
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 bg-gray-200 rounded"></div>
              <div className="h-4 w-28 bg-gray-200 rounded"></div>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 bg-gray-200 rounded"></div>
              <div className="h-4 w-36 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 bg-gray-200 rounded"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 sm:ml-4">
        <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
        <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  </div>
);

export function PatientManager() {
  const { 
    patients, 
    patientsMetadata,
    socialWorks,
    addPatient, 
    updatePatient, 
    deletePatient, 
    loadingPatients, 
    loadPatients,
    searchPatients,
    loadSocialWorkPlans,
    loadSocialWorks
  } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterDNI, setFilterDNI] = useState('');
  const [filterSocialWork, setFilterSocialWork] = useState('');
  const [filterAffiliateNumber, setFilterAffiliateNumber] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dniValidation, setDniValidation] = useState<{
    isChecking: boolean;
    exists: boolean;
    message: string;
  }>({ isChecking: false, exists: false, message: '' });
  const [selectedSocialWorkForForm, setSelectedSocialWorkForForm] = useState<any>(null);
  const [debouncedFilters, setDebouncedFilters] = useState({
    searchTerm: '',
    filterName: '',
    filterDNI: '',
    filterSocialWork: '',
    filterAffiliateNumber: ''
  });
  const [formData, setFormData] = useState({
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

  // Cargar pacientes cuando se monta el componente
  useEffect(() => {
    loadPatients(1, true);
    loadSocialWorks();
    loadSocialWorkPlans();
  }, []);

  // Función para buscar pacientes con debounce
  useEffect(() => {
    // Actualizar los filtros con debounce después de 1 segundo
    const timeoutId = setTimeout(() => {
      setDebouncedFilters({
        searchTerm,
        filterName,
        filterDNI,
        filterSocialWork,
        filterAffiliateNumber
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterName, filterDNI, filterSocialWork, filterAffiliateNumber]);

  // Ejecutar búsqueda cuando cambien los filtros con debounce
  useEffect(() => {
    handleSearch();
  }, [debouncedFilters]);

  const handleSearch = async () => {
    const hasFilters = debouncedFilters.searchTerm || debouncedFilters.filterName || debouncedFilters.filterDNI || debouncedFilters.filterSocialWork || debouncedFilters.filterAffiliateNumber;
    
    if (hasFilters) {
      setIsSearching(true);
      const filters = {
        name: debouncedFilters.filterName,
        dni: debouncedFilters.filterDNI,
        socialWork: debouncedFilters.filterSocialWork,
        affiliateNumber: debouncedFilters.filterAffiliateNumber
      };
      await searchPatients(debouncedFilters.searchTerm, filters, 1, true);
      setIsSearching(false);
    } else {
      // Si no hay filtros, cargar todos los pacientes
      await loadPatients(1, true);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !patientsMetadata.hasMore) return;
    
    setLoadingMore(true);
    const nextPage = patientsMetadata.currentPage + 1;
    
    const hasFilters = debouncedFilters.searchTerm || debouncedFilters.filterName || debouncedFilters.filterDNI || debouncedFilters.filterSocialWork || debouncedFilters.filterAffiliateNumber;
    
    if (hasFilters) {
      const filters = {
        name: debouncedFilters.filterName,
        dni: debouncedFilters.filterDNI,
        socialWork: debouncedFilters.filterSocialWork,
        affiliateNumber: debouncedFilters.filterAffiliateNumber
      };
      await searchPatients(debouncedFilters.searchTerm, filters, nextPage, false);
    } else {
      await loadPatients(nextPage, false);
    }
    
    setLoadingMore(false);
  };

  // Validar DNI en tiempo real
  const validateDNI = async (dni: string) => {
    if (dni.length < 4) {
      setDniValidation({ isChecking: false, exists: false, message: '' });
      return;
    }

    setDniValidation({ isChecking: true, exists: false, message: 'Verificando DNI...' });

    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, last_name, social_work')
        .eq('dni', dni)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error checking DNI:', error);
        setDniValidation({ isChecking: false, exists: false, message: 'Error al verificar DNI' });
        return;
      }

      if (data && data.length > 0) {
        // Filtrar pacientes que no sean el que estamos editando
        const otherPatients = editingPatient 
          ? data.filter(p => p.id !== editingPatient.id)
          : data;
        
        if (otherPatients.length > 0) {
          const count = otherPatients.length;
          const firstPatient = otherPatients[0];
          setDniValidation({
            isChecking: false,
            exists: false, // Cambiar a false ya que ahora es permitido
            message: `${count} paciente${count > 1 ? 's' : ''} con este DNI: ${firstPatient.name} ${firstPatient.last_name || ''}${count > 1 ? ` y ${count - 1} más` : ''}`
          });
        } else {
          setDniValidation({ isChecking: false, exists: false, message: '' });
        }
      } else {
        setDniValidation({ isChecking: false, exists: false, message: '' });
      }
    } catch (error) {
      console.error('Error validating DNI:', error);
      setDniValidation({ isChecking: false, exists: false, message: 'Error al verificar DNI' });
    }
  };

  // Validar si el formulario es válido
  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.lastName.trim() !== '' &&
      formData.dni.length >= 4 &&
      formData.socialWork.trim() !== ''
    );
  };

  // Los pacientes ya vienen filtrados y ordenados desde el servidor
  const filteredPatients = patients;

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterName('');
    setFilterDNI('');
    setFilterSocialWork('');
    setFilterAffiliateNumber('');
    // Recargar la primera página sin filtros
    loadPatients(1, true);
  };

  const hasActiveFilters = searchTerm || filterName || filterDNI || filterSocialWork || filterAffiliateNumber;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setErrorMessage('Por favor complete todos los campos obligatorios correctamente');
      setShowErrorModal(true);
      return;
    }

    const handleAsync = async () => {
      try {
        if (editingPatient) {
          await updatePatient(editingPatient.id, formData);
        } else {
          await addPatient(formData);
        }
        resetForm();
      } catch (error) {
        console.error('Error saving patient:', error);
        setErrorMessage('Error al guardar el paciente. Por favor, intente nuevamente.');
        setShowErrorModal(true);
      }
    };
    
    handleAsync();
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    const socialWork = socialWorks.find(sw => sw.name === patient.socialWork);
    setSelectedSocialWorkForForm(socialWork || null);
    setFormData({
      name: patient.name,
      lastName: patient.lastName,
      dni: patient.dni,
      socialWork: patient.socialWork,
      affiliateNumber: patient.affiliateNumber,
      plan: patient.plan || '',
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || ''
    });
    setShowForm(true);
  };

  const handleDeleteClick = (patient: Patient) => {
    setPatientToDelete(patient);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!patientToDelete) return;
    
    try {
      await deletePatient(patientToDelete.id);
      setShowDeleteModal(false);
      setPatientToDelete(null);
    } catch (error) {
      console.error('Error deleting patient:', error);
      setShowDeleteModal(false);
      setPatientToDelete(null);
      setErrorMessage('Error al eliminar el paciente. Verifique que no tenga recetas asociadas.');
      setShowErrorModal(true);
    }
  };

  const resetForm = () => {
    setFormData({
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
    setDniValidation({ isChecking: false, exists: false, message: '' });
    setEditingPatient(null);
    setShowForm(false);
    setSelectedSocialWorkForForm(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-green-600" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Gestión de Pacientes</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
        >
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo Paciente</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-gray-50 p-3 sm:p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingPatient ? 'Editar Paciente' : 'Nuevo Paciente'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                  value={formData.dni}
                  onChange={(e) => {
                    const newDni = e.target.value.replace(/\D/g, '');
                    setFormData({...formData, dni: newDni});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="12345678"
                  pattern="[0-9]{4,}"
                />
              </div>
              <div>
                <SocialWorkAutocomplete
                  value={formData.socialWork}
                  onChange={(value) => {
                    setFormData({...formData, socialWork: value, plan: ''});
                    const socialWork = socialWorks.find(sw => sw.name === value);
                    setSelectedSocialWorkForForm(socialWork || null);
                  }}
                  required
                />
              </div>
              <div>
                <SocialWorkPlanSelector
                  selectedSocialWork={selectedSocialWorkForForm}
                  value={formData.plan}
                  onChange={(value) => setFormData({...formData, plan: value})}
                  placeholder="Seleccionar plan..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Afiliado
                </label>
                <input
                  type="text"
                  value={formData.affiliateNumber}
                  onChange={(e) => setFormData({...formData, affiliateNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="2966 123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="paciente@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Av. Kirchner 456"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!isFormValid()}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isFormValid()
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {editingPatient ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros de búsqueda */}
      <div className="mb-6">
        {/* Información de paginación */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-sm text-blue-800">
              <span className="font-medium">
                Mostrando {patients.length} de {patientsMetadata.totalCount.toLocaleString()} pacientes
              </span>
              {patientsMetadata.currentPage > 1 && (
                <span className="ml-2">
                  (Página {patientsMetadata.currentPage})
                </span>
              )}
            </div>
            {(isSearching || loadingPatients) && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>{isSearching ? 'Buscando...' : 'Cargando...'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Búsqueda principal */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Búsqueda general (nombre, DNI, obra social, afiliado)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loadingPatients}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                showAdvancedFilters || hasActiveFilters
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-600 border border-red-300 rounded-lg hover:bg-red-200 transition-colors"
                title="Limpiar todos los filtros"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* Filtros avanzados */}
        {showAdvancedFilters && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Filtros Específicos</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nombre y Apellido
                </label>
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  disabled={loadingPatients}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  DNI
                </label>
                <input
                  type="text"
                  placeholder="Ej: 12345678"
                  value={filterDNI}
                  onChange={(e) => setFilterDNI(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  disabled={loadingPatients}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  maxLength={8}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Obra Social
                </label>
                <SocialWorkAutocomplete
                  value={filterSocialWork}
                  onChange={(value) => setFilterSocialWork(value)}
                  disabled={loadingPatients}
                  placeholder="Ej: OSDE, IOMA"
                  label=""
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  N° Afiliado
                </label>
                <input
                  type="text"
                  placeholder="Ej: 123456789"
                  value={filterAffiliateNumber}
                  onChange={(e) => setFilterAffiliateNumber(e.target.value)}
                  disabled={loadingPatients}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="grid gap-4">
        {loadingPatients && patients.length === 0 ? (
          // Mostrar skeletons mientras carga
          [...Array(5)].map((_, index) => (
            <SkeletonPatientCard key={index} />
          ))
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {patientsMetadata.totalCount === 0 
                ? 'No hay pacientes registrados'
                : 'No se encontraron pacientes con los filtros aplicados'
              }
            </p>
            {hasActiveFilters && patientsMetadata.totalCount > 0 && (
              <p className="text-gray-400 mt-2">
                Intente ajustar los filtros de búsqueda
              </p>
            )}
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <div key={patient.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">{patient.name} {patient.lastName}</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {patient.socialWork}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 text-sm text-gray-600">
                    <div>
                      <p><strong>DNI:</strong> {patient.dni}</p>
                      {patient.affiliateNumber && (
                        <p><strong>N° Afiliado:</strong> {patient.affiliateNumber}</p>
                      )}
                      {patient.plan && (
                        <p><strong>Plan:</strong> {patient.plan}</p>
                      )}
                    </div>
                    <div>
                      {patient.phone && (
                        <p className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {patient.phone}
                        </p>
                      )}
                      {patient.email && (
                        <p className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {patient.email}
                        </p>
                      )}
                    </div>
                    <div>
                      {patient.address && (
                        <p className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {patient.address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 sm:ml-4">
                  <button
                    onClick={() => handleEdit(patient)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(patient)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Botón para cargar más */}
      {patientsMetadata.hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
          >
            {loadingMore ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Cargando más...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Cargar más pacientes
              </>
            )}
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Mostrando {patients.length} de {patientsMetadata.totalCount.toLocaleString()} pacientes
          </p>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && patientToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Confirmar Eliminación
                  </h3>
                  <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                ¿Está seguro que desea eliminar al paciente <strong>{patientToDelete.name} {patientToDelete.lastName}</strong>?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPatientToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
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