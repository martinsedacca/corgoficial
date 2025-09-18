import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { AutoComplete } from './AutoComplete';
import { SocialWorkAutocomplete } from './SocialWorkAutocomplete';
import { PrescriptionItem, Doctor, Patient, Practice, Prescription } from '../types';
import { Plus, Trash2, FileText, Save, X } from 'lucide-react';

interface PrescriptionFormProps {
  onSubmit: (prescription: any) => void;
  onCancel: () => void;
  editingPrescription?: Prescription | null;
}

export function PrescriptionForm({ onSubmit, onCancel, editingPrescription }: PrescriptionFormProps) {
  const { doctors, patients, practices, getNextPrescriptionNumber, addPrescription, updatePrescription } = useData();
  const { profile, isDoctor } = useAuth();
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    socialWork: '',
    affiliateNumber: '',
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
      setPatientSearch(editingPrescription.patient.name);
      setAdditionalNotes(editingPrescription.additionalNotes || '');
      
      // Configurar prácticas seleccionadas
      const practicesMap: {[key: string]: 'AO' | 'OI' | 'OD' | null} = {};
      editingPrescription.items.forEach(item => {
        practicesMap[item.practiceId] = item.ao || 'AO';
      });
      setSelectedPractices(practicesMap);
    } else if (isDoctor && profile?.doctor_id) {
      // Si es médico, preseleccionar sus datos
      const doctorData = doctors.find(d => d.id === profile.doctor_id);
      if (doctorData) {
        setSelectedDoctor(doctorData);
        setDoctorSearch(doctorData.name);
      }
    }
  }, [editingPrescription, isDoctor, profile, doctors]);

  const doctorOptions = doctors.map(doctor => ({
    id: doctor.id,
    label: `${doctor.name} - ${doctor.specialty}`,
    value: doctor
  }));

  const patientOptions = patients.map(patient => ({
    id: patient.id,
    label: `${patient.name} - ${patient.socialWork}`,
    value: patient
  }));

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
    setNewPatientData({ ...newPatientData, name });
    setShowPatientForm(true);
  };

  const handleSaveNewPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { addPatient } = useData();
      await addPatient(newPatientData);
      // Buscar el paciente recién creado
      const { patients } = useData();
      const newPatient = patients.find(p => p.name === newPatientData.name);
      if (newPatient) {
        setSelectedPatient(newPatient);
        setPatientSearch(newPatient.name);
      }
      setShowPatientForm(false);
      setNewPatientData({
        name: '',
        socialWork: '',
        affiliateNumber: '',
        phone: '',
        email: '',
        address: ''
      });
    } catch (error) {
      console.error('Error creating patient:', error);
      alert('Error al crear el paciente. Por favor, intente nuevamente.');
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
      alert('Por favor complete todos los campos obligatorios');
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
      alert('Debe seleccionar al menos una práctica');
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
        alert('Error al guardar la receta. Por favor, intente nuevamente.');
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
              <div className="text-sm sm:text-base font-medium">Autorización</div>
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
              {selectedDoctor?.name} - {selectedDoctor?.specialty}
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
            options={patientOptions}
            value={patientSearch}
            onChange={handlePatientChange}
            placeholder="Buscar paciente..."
            label="Paciente"
            onCreateNew={handleCreatePatient}
            createNewLabel="Crear paciente"
          />
          
          {/* Formulario para crear nuevo paciente */}
          {showPatientForm && (
            <div className="mt-4 p-3 sm:p-4 border border-primary-200 rounded-lg bg-primary-50">
              <h4 className="text-lg font-medium text-primary-800 mb-3">Crear Nuevo Paciente</h4>
              <form onSubmit={handleSaveNewPatient} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPatientData.name}
                      onChange={(e) => setNewPatientData({...newPatientData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <SocialWorkAutocomplete
                      value={newPatientData.socialWork}
                      onChange={(value) => setNewPatientData({...newPatientData, socialWork: value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Afiliado *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPatientData.affiliateNumber}
                      onChange={(e) => setNewPatientData({...newPatientData, affiliateNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Crear Paciente
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPatientForm(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
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
    </div>
  );
}