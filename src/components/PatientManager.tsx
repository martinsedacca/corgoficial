import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { supabase } from '../lib/supabase';
import { Patient } from '../types';
import { SocialWorkAutocomplete } from './SocialWorkAutocomplete';
import { UserPlus, Edit3, Trash2, Users, Phone, Mail, MapPin, Search, Filter, X, AlertTriangle } from 'lucide-react';

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
  const { patients, addPatient, updatePatient, deletePatient, loading } = useData();
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
  const [dniValidation, setDniValidation] = useState<{
    isChecking: boolean;
    exists: boolean;
    message: string;
  }>({ isChecking: false, exists: false, message: '' });
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

  // Validar DNI en tiempo real
  const validateDNI = async (dni: string) => {
    if (dni.length !== 8) {
      setDniValidation({ isChecking: false, exists: false, message: '' });
      return;
    }

    setDniValidation({ isChecking: true, exists: false, message: 'Verificando DNI...' });

    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, last_name')
        .eq('dni', dni)
        .limit(1);

      if (error) {
        console.error('Error checking DNI:', error);
        setDniValidation({ isChecking: false, exists: false, message: 'Error al verificar DNI' });
        return;
      }

      if (data && data.length > 0) {
        // Si estamos editando y el DNI pertenece al mismo paciente, está OK
        if (editingPatient && data[0].id === editingPatient.id) {
          setDniValidation({ isChecking: false, exists: false, message: '' });
        } else {
          const existingPatient = data[0];
          setDniValidation({
            isChecking: false,
            exists: true,
            message: `DNI ya registrado para: ${existingPatient.name} ${existingPatient.last_name || ''}`
          });
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
      formData.dni.length === 8 &&
      !dniValidation.exists &&
      !dniValidation.isChecking &&
      formData.socialWork.trim() !== ''
    );
  };

  // Filtrar pacientes
  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.name} ${patient.lastName}`.toLowerCase();
    
    // Búsqueda general
    const matchesSearch = !searchTerm || 
      fullName.includes(searchTerm.toLowerCase()) ||
      patient.dni.includes(searchTerm) ||
      patient.socialWork.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.affiliateNumber && patient.affiliateNumber.includes(searchTerm));
    
    // Filtros específicos
    const matchesName = !filterName || fullName.includes(filterName.toLowerCase());
    const matchesDNI = !filterDNI || patient.dni.includes(filterDNI);
    const matchesSocialWork = !filterSocialWork || 
      patient.socialWork.toLowerCase().includes(filterSocialWork.toLowerCase());
    const matchesAffiliateNumber = !filterAffiliateNumber || 
      (patient.affiliateNumber && patient.affiliateNumber.includes(filterAffiliateNumber));
    
    return matchesSearch && matchesName && matchesDNI && matchesSocialWork && matchesAffiliateNumber;
  }).sort((a, b) => {
    const fullNameA = `${a.name} ${a.lastName}`.trim();
    const fullNameB = `${b.name} ${b.lastName}`.trim();
    return fullNameA.localeCompare(fullNameB, 'es', { sensitivity: 'base' });
  });

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterName('');
    setFilterDNI('');
    setFilterSocialWork('');
    setFilterAffiliateNumber('');
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
                    const newDni = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setFormData({...formData, dni: newDni});
                    if (newDni.length === 8) {
                      validateDNI(newDni);
                    } else {
                      setDniValidation({ isChecking: false, exists: false, message: '' });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-colors ${
                    dniValidation.exists
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                  }`}
                  placeholder="12345678"
                  maxLength={8}
                  pattern="[0-9]{8}"
                />
                {dniValidation.message && (
                  <div className={`mt-1 text-sm flex items-center gap-1 ${
                    dniValidation.exists ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {dniValidation.isChecking && (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                    )}
                    <span>{dniValidation.message}</span>
                  </div>
                )}
              </div>
              <div>
                <SocialWorkAutocomplete
                  value={formData.socialWork}
                  onChange={(value) => setFormData({...formData, socialWork: value})}
                  required
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
                  Plan
                </label>
                <input
                  type="text"
                  value={formData.plan}
                  onChange={(e) => setFormData({...formData, plan: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Plan 210, Plan Premium, etc."
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="grid gap-4">
        {loading ? (
          // Mostrar skeletons mientras carga
          [...Array(5)].map((_, index) => (
            <SkeletonPatientCard key={index} />
          ))
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {patients.length === 0 
                ? 'No hay pacientes registrados'
                : 'No se encontraron pacientes con los filtros aplicados'
              }
            </p>
            {hasActiveFilters && patients.length > 0 && (
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

      {/* Contador de resultados */}
      {filteredPatients.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Mostrando {filteredPatients.length} de {patients.length} pacientes
          {hasActiveFilters && (
            <span className="ml-2 text-green-600">
              (filtrados)
            </span>
          )}
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