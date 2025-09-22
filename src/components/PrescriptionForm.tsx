import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AutoComplete } from './AutoComplete';
import { SocialWorkAutocomplete } from './SocialWorkAutocomplete';
import { PrescriptionItem, Doctor, Patient, Practice, Prescription } from '../types';
import { Plus, Trash2, FileText, Save, X, AlertTriangle } from 'lucide-react';

interface PrescriptionFormProps {
  onSubmit: (prescription: any) => void;
  onCancel: () => void;
  editingPrescription?: Prescription | null;
}

export function PrescriptionForm({ onSubmit, onCancel, editingPrescription }: PrescriptionFormProps) {
  const { 
    doctors, 
    practices, 
    loadingDoctors,
    loadingPractices,
    loadDoctors,
    loadPractices,
    searchPatientsForAutocomplete,
    getNextPrescriptionNumber, 
    addPrescription, 
    updatePrescription, 
    addPatient 
  } = useData();
  const { profile, isDoctor } = useAuth();
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [dniValidation, setDniValidation] = useState<{
    isChecking: boolean;
    exists: boolean;
    message: string;
  }>({ isChecking: false, exists: false, message: '' });
  const [newPatientData, setNewPatientData] = useState({
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
  const [nextNumber, setNextNumber] = useState<number | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [prescriptionType, setPrescriptionType] = useState<'studies' | 'treatments' | 'authorization'>('studies');
  const [selectedPractices, setSelectedPractices] = useState<{[key: string]: 'AO' | 'OI' | 'OD' | null}>({});
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [patientCreationSuccess, setPatientCreationSuccess] = useState(false);
  const [creatingPatient, setCreatingPatient] = useState(false);
  
  // Cargar datos necesarios para el formulario
  useEffect(() => {
    loadDoctors();
    loadPractices();
  }, []);

  // Función para buscar pacientes en el autocomplete
  const handlePatientSearch = async (searchTerm: string): Promise<Option[]> => {
    try {
      const patients = await searchPatientsForAutocomplete(searchTerm);
      return patients.map(patient => ({
        id: patient.id,
        label: `${patient.name} ${patient.lastName} - DNI: ${patient.dni} - ${patient.socialWork}${patient.plan ? ` (${patient.plan})` : ''}`,
        value: patient
      }));
    } catch (error) {
      console.error('Error searching patients:', error);
      return [];
    }
  };

  // Si es doctor, preseleccionar su información
  useEffect(() => {
    if (isDoctor && profile?.doctor_id && doctors.length > 0) {
      const doctorData = doctors.find(d => d.id === profile.doctor_id);
      if (doctorData) {
        setSelectedDoctor(doctorData);
        setDoctorSearch(doctorData.name);
      }
    }
  }, [isDoctor, profile, doctors]);

  // Validar DNI en tiempo real para nuevo paciente
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
        const count = data.length;
        const firstPatient = data[0];
        setDniValidation({
          isChecking: false,
          exists: false, // Cambiar a false ya que ahora es permitido
          message: `${count} paciente${count > 1 ? 's' : ''} con este DNI: ${firstPatient.name} ${firstPatient.last_name || ''}${count > 1 ? ` y ${count - 1} más` : ''}`
        });
      } else {
        setDniValidation({ isChecking: false, exists: false, message: '' });
      }
    } catch (error) {
      console.error('Error validating DNI:', error);
      setDniValidation({ isChecking: false, exists: false, message: 'Error al verificar DNI' });
    }
  };

  // Validar si el formulario de nuevo paciente es válido
  const isNewPatientFormValid = () => {
    return (
      newPatientData.name.trim() !== '' &&
      newPatientData.lastName.trim() !== '' &&
      newPatientData.dni.length >= 4 &&
      !dniValidation.isChecking &&
      newPatientData.socialWork.trim() !== ''
    );
  };
  // Cargar el siguiente número de receta
  useEffect(() => {
    if (!editingPrescription) {
      const loadNextNumber = async () => {
        try {
          const number = await getNextPrescriptionNumber();
          setNextNumber(number);
        } catch (error) {
          console.error('Error loading next prescription number:', error);
        }
      };
      loadNextNumber();
    }
  }, [editingPrescription, getNextPrescriptionNumber]);

  // Inicializar formulario si estamos editando
  useEffect(() => {
    if (editingPrescription) {
      setSelectedDoctor(editingPrescription.doctor);
      setSelectedPatient(editingPrescription.patient);
      setPrescriptionType(editingPrescription.type);
      setDoctorSearch(editingPrescription.doctor.name);
      setPatientSearch(`${editingPrescription.patient.name} ${editingPrescription.patient.lastName} - DNI: ${editingPrescription.patient.dni} - ${editingPrescription.patient.socialWork}${editingPrescription.patient.plan ? ` (${editingPrescription.patient.plan})` : ''}`);
      setAdditionalNotes(editingPrescription.additionalNotes || '');
      
      // Configurar prácticas seleccionadas
      const practicesMap: {[key: string]: 'AO' | 'OI' | 'OD' | null} = {};
      editingPrescription.items.forEach(item => {
        practicesMap[item.practiceId] = item.ao || 'AO';
      });
      setSelectedPractices(practicesMap);
    }
  }, [editingPrescription]);

  const doctorOptions = doctors.map(doctor => ({
    id: doctor.id,
    label: `${doctor.name} - ${doctor.license}`,
    value: doctor
  })).sort((a, b) => a.value.name.localeCompare(b.value.name, 'es', { sensitivity: 'base' }));

  const filteredPractices = practices.filter(practice => {
    if (prescriptionType === 'studies') return practice.category === 'study';
    if (prescriptionType === 'treatments') return practice.category === 'treatment';
    return practice.category === 'surgery';
  });

  const handleDoctorChange = (value: string, option?: any) => {
    setDoctorSearch(value);
    if (option) {
      setSelectedDoctor(option.value);
    }
  };

  const handlePatientChange = (value: string, option?: any) => {
    setPatientSearch(value);
    if (option) {
      setSelectedPatient(option.value);
    }
  };

  const handleCreatePatient = (name: string) => {
    // Separar automáticamente nombre y apellido
    const nameParts = name.trim().split(' ');
    if (nameParts.length > 1) {
      // La última palabra es el apellido, el resto es el nombre
      const lastName = nameParts.pop() || '';
      const firstName = nameParts.join(' ');
      setNewPatientData({ ...newPatientData, name: firstName, lastName });
    } else {
      // Solo una palabra, va al nombre
      setNewPatientData({ ...newPatientData, name: name.trim(), lastName: '' });
    }
    setShowPatientForm(true);
  };

  const handleSaveNewPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevenir que se propague al formulario padre
    
    if (!isNewPatientFormValid()) {
      alert('Por favor complete todos los campos obligatorios correctamente');
      return;
    }

    setCreatingPatient(true);
    try {
      const createdPatient = await addPatient(newPatientData);
      
      // Mostrar mensaje de éxito
      setPatientCreationSuccess(true);
      
      // Seleccionar el paciente creado directamente
      setSelectedPatient(createdPatient);
      setPatientSearch(`${createdPatient.name} ${createdPatient.lastName} - DNI: ${createdPatient.dni} - ${createdPatient.socialWork}${createdPatient.plan ? ` (${createdPatient.plan})` : ''}`);
      
      // Limpiar formulario y cerrar después de un tiempo más corto
      setTimeout(() => {
        setPatientCreationSuccess(false);
        setCreatingPatient(false);
        setShowPatientForm(false);
        setDniValidation({ isChecking: false, exists: false, message: '' });
        setNewPatientData({
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
      }, 1500);
      
    } catch (error) {
      console.error('Error creating patient:', error);
      alert('Error al crear el paciente. Por favor, intente nuevamente.');
      setCreatingPatient(false);
    }
  };

  const handlePracticeToggle = (practiceId: string, ao: 'AO' | 'OI' | 'OD') => {
    setSelectedPractices(prev => {
      const current = prev[practiceId];
      if (current === ao) {
        // Si ya está seleccionado, lo deseleccionamos
        const newState = { ...prev };
        delete newState[practiceId];
        return newState;
      } else {
        // Seleccionamos el nuevo valor
        return { ...prev, [practiceId]: ao };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedPatient) {
      setErrorMessage('Por favor complete todos los campos obligatorios');
      setShowErrorModal(true);
      return;
    }

    // Validación adicional para médicos: solo pueden crear recetas a su nombre
    if (isDoctor && profile?.doctor_id && selectedDoctor.id !== profile.doctor_id) {
      setErrorMessage('Los médicos solo pueden crear recetas a su propio nombre');
      setShowErrorModal(true);
      return;
    }

    const selectedPracticesList = Object.entries(selectedPractices)
      .filter(([_, ao]) => ao !== null)
      .map(([practiceId, ao]) => {
        const practice = practices.find(p => p.id === practiceId);
        return {
          practiceId,
          practice: practice!,
          ao,
          notes: ''
        };
      });

    if (selectedPracticesList.length === 0) {
      setErrorMessage('Debe seleccionar al menos una práctica');
      setShowErrorModal(true);
      return;
    }

    const prescriptionData = {
      type: prescriptionType,
      doctorId: selectedDoctor.id,
      doctor: selectedDoctor,
      patientId: selectedPatient.id,
      patient: selectedPatient,
      items: selectedPracticesList,
      additionalNotes,
      date: editingPrescription?.date || new Date().toISOString().split('T')[0]
    };

    const handleAsync = async () => {
      try {
        if (editingPrescription) {
          await updatePrescription(editingPrescription.id, prescriptionData);
        } else {
          await addPrescription(prescriptionData);
        }
        onSubmit(prescriptionData);
      } catch (error) {
        console.error('Error saving prescription:', error);
        setErrorMessage('Error al guardar la receta. Por favor, intente nuevamente.');
        setShowErrorModal(true);
      }
    };
    
    handleAsync();
  };

  // Organizar prácticas en dos columnas como en el PDF
  const leftColumnPractices = filteredPractices.slice(0, Math.ceil(filteredPractices.length / 2));
  const rightColumnPractices = filteredPractices.slice(Math.ceil(filteredPractices.length / 2));

  return (
    <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6 text-primary-600" />
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
          {editingPrescription ? `Editar Receta #${editingPrescription.number}` : `Nueva Receta #${nextNumber || '...'}`}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de receta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Receta
          </label>
          <div className="grid grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setPrescriptionType('studies')}
              className={`p-2 sm:p-3 rounded-lg border-2 transition-colors ${
                prescriptionType === 'studies'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="text-sm sm:text-base font-medium">Estudios</div>
              <div className="text-xs text-gray-500 hidden sm:block">Autorización de estudios</div>
            </button>
            <button
              type="button"
              onClick={() => setPrescriptionType('treatments')}
              className={`p-2 sm:p-3 rounded-lg border-2 transition-colors ${
                prescriptionType === 'treatments'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="text-sm sm:text-base font-medium">Tratamientos</div>
              <div className="text-xs text-gray-500 hidden sm:block">Procedimientos láser</div>
            </button>
            <button
              type="button"
              onClick={() => setPrescriptionType('authorization')}
              className={`p-2 sm:p-3 rounded-lg border-2 transition-colors ${
                prescriptionType === 'authorization'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="text-sm sm:text-base font-medium">Cirugías</div>
              <div className="text-xs text-gray-500 hidden sm:block">Cirugías</div>
            </button>
          </div>
        </div>

        {/* Médico */}
        {isDoctor ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Médico
            </label>
            <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
              {selectedDoctor?.name} - {selectedDoctor?.license}
            </div>
          </div>
        ) : (
          <AutoComplete
            options={doctorOptions}
            value={doctorSearch}
            onChange={handleDoctorChange}
            placeholder="Buscar médico..."
            label="Médico"
          />
        )}

        {/* Paciente */}
        <div>
          <AutoComplete
            options={[]} // No cargar opciones por defecto
            value={patientSearch}
            onChange={handlePatientChange}
            placeholder="Escriba al menos 3 caracteres para buscar..."
            searchPlaceholder="Buscar por nombre, apellido o DNI..."
            label="Paciente"
            onSearch={handlePatientSearch}
            minSearchLength={3}
            onCreateNew={handleCreatePatient}
            createNewLabel="Crear paciente"
          />
          
          {/* Formulario para crear nuevo paciente */}
          {showPatientForm && (
            <div className={`mt-4 p-3 sm:p-4 border border-primary-200 rounded-lg bg-primary-50 ${creatingPatient ? 'opacity-75' : ''}`}>
              {/* Mensaje de éxito */}
              {patientCreationSuccess && (
                <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <span className="text-green-800 font-medium">¡Paciente creado exitosamente!</span>
                  </div>
                </div>
              )}
              
              {/* Mensaje de carga */}
              {creatingPatient && !patientCreationSuccess && (
                <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="text-blue-800 font-medium">Creando paciente...</span>
                  </div>
                </div>
              )}
              
              <h4 className="text-lg font-medium text-primary-800 mb-3">Crear Nuevo Paciente</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPatientData.name}
                      onChange={(e) => setNewPatientData({...newPatientData, name: e.target.value})}
                      disabled={creatingPatient}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Juan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPatientData.lastName || ''}
                      onChange={(e) => setNewPatientData({...newPatientData, lastName: e.target.value})}
                      disabled={creatingPatient}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Pérez"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DNI *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPatientData.dni}
                      onChange={(e) => {
                        const newDni = e.target.value.replace(/\D/g, '');
                        setNewPatientData({...newPatientData, dni: newDni});
                        if (newDni.length >= 8) {
                          validateDNI(newDni);
                        } else if (newDni.length >= 4) {
                          // Validar después de 2 segundos si tiene más de 4 caracteres
                          setTimeout(() => {
                            if (newPatientData.dni === newDni && newDni.length >= 4) {
                              validateDNI(newDni);
                            }
                          }, 2000);
                        } else {
                          setDniValidation({ isChecking: false, exists: false, message: '' });
                        }
                      }}
                      disabled={creatingPatient}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-colors ${
                        'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                      }`}
                      placeholder="12345678"
                      pattern="[0-9]{4,}"
                    />
                    {dniValidation.message && (
                      <div className={`mt-1 text-sm flex items-center gap-1 ${
                        'text-blue-600'
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
                      value={newPatientData.socialWork}
                      onChange={(value) => setNewPatientData({...newPatientData, socialWork: value})}
                      disabled={creatingPatient}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Afiliado
                    </label>
                    <input
                      type="text"
                      value={newPatientData.affiliateNumber}
                      onChange={(e) => setNewPatientData({...newPatientData, affiliateNumber: e.target.value})}
                      disabled={creatingPatient}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plan
                    </label>
                    <input
                      type="text"
                      value={newPatientData.plan}
                      onChange={(e) => setNewPatientData({...newPatientData, plan: e.target.value})}
                      disabled={creatingPatient}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Plan 210, Plan Premium, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={newPatientData.phone}
                      onChange={(e) => setNewPatientData({...newPatientData, phone: e.target.value})}
                      disabled={creatingPatient}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newPatientData.email}
                      onChange={(e) => setNewPatientData({...newPatientData, email: e.target.value})}
                      disabled={creatingPatient}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={newPatientData.address}
                      onChange={(e) => setNewPatientData({...newPatientData, address: e.target.value})}
                      disabled={creatingPatient}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSaveNewPatient}
                    disabled={creatingPatient || patientCreationSuccess || !isNewPatientFormValid()}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isNewPatientFormValid() && !creatingPatient && !patientCreationSuccess
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {creatingPatient ? 'Creando...' : patientCreationSuccess ? '¡Creado!' : 'Crear Paciente'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPatientForm(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={creatingPatient}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Prácticas en formato de grid como el PDF */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Solicito:
          </label>
          
          {/* Grid de prácticas */}
          <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
              {/* Columna izquierda */}
              <div className="space-y-2">
                {leftColumnPractices.map((practice) => (
                  <div key={practice.id} className="flex items-center justify-between text-xs sm:text-sm">
                    <span className={`flex-1 ${selectedPractices[practice.id] ? 'font-semibold text-primary-700' : 'text-gray-700'}`}>
                      {practice.name.toUpperCase()}
                    </span>
                    <div className="flex gap-1 ml-1 sm:ml-2">
                      {(['AO', 'OI', 'OD'] as const).map((ao) => (
                        <button
                          key={ao}
                          type="button"
                          onClick={() => handlePracticeToggle(practice.id, ao)}
                          className={`w-6 h-5 sm:w-8 sm:h-6 border border-gray-400 text-xs font-bold transition-colors flex items-center justify-center ${
                            selectedPractices[practice.id] === ao
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          {selectedPractices[practice.id] === ao ? ao : ao}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Columna derecha */}
              <div className="space-y-2 lg:block hidden">
                {rightColumnPractices.map((practice) => (
                  <div key={practice.id} className="flex items-center justify-between text-xs sm:text-sm">
                    <span className={`flex-1 ${selectedPractices[practice.id] ? 'font-semibold text-primary-700' : 'text-gray-700'}`}>
                      {practice.name.toUpperCase()}
                    </span>
                    <div className="flex gap-1 ml-1 sm:ml-2">
                      {(['AO', 'OI', 'OD'] as const).map((ao) => (
                        <button
                          key={ao}
                          type="button"
                          onClick={() => handlePracticeToggle(practice.id, ao)}
                          className={`w-6 h-5 sm:w-8 sm:h-6 border border-gray-400 text-xs font-bold transition-colors flex items-center justify-center ${
                            selectedPractices[practice.id] === ao
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          {selectedPractices[practice.id] === ao ? ao : ao}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Mostrar columna derecha en móvil */}
              <div className="space-y-2 lg:hidden">
                {rightColumnPractices.map((practice) => (
                  <div key={practice.id} className="flex items-center justify-between text-xs sm:text-sm">
                    <span className={`flex-1 ${selectedPractices[practice.id] ? 'font-semibold text-primary-700' : 'text-gray-700'}`}>
                      {practice.name.toUpperCase()}
                    </span>
                    <div className="flex gap-1 ml-1 sm:ml-2">
                      {(['AO', 'OI', 'OD'] as const).map((ao) => (
                        <button
                          key={ao}
                          type="button"
                          onClick={() => handlePracticeToggle(practice.id, ao)}
                          className={`w-6 h-5 sm:w-8 sm:h-6 border border-gray-400 text-xs font-bold transition-colors flex items-center justify-center ${
                            selectedPractices[practice.id] === ao
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          {selectedPractices[practice.id] === ao ? ao : ao}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resumen de selecciones */}
          {Object.keys(selectedPractices).length > 0 && (
            <div className="mt-4 p-3 bg-primary-50 rounded-lg">
              <div className="text-sm font-medium text-primary-800 mb-2">
                Prácticas seleccionadas ({Object.keys(selectedPractices).length}):
              </div>
              <div className="text-sm text-primary-700">
                {Object.entries(selectedPractices).map(([practiceId, ao]) => {
                  const practice = practices.find(p => p.id === practiceId);
                  return practice ? `${practice.name} (${ao})` : '';
                }).filter(Boolean).join(', ')}
              </div>
            </div>
          )}
        </div>

        {/* Notas adicionales */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observaciones Generales
          </label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Observaciones adicionales sobre la receta..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            <Save className="h-5 w-5" />
            {editingPrescription ? 'Actualizar Receta' : 'Crear Receta'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-400 transition-colors"
          >
            <X className="h-5 w-5" />
            Cancelar
          </button>
        </div>
      </form>

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