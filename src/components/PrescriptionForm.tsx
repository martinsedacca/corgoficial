import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { AutoComplete } from './AutoComplete';
import { PrescriptionItem, Doctor, Patient, Practice, Prescription } from '../types';
import { Plus, Trash2, FileText, Save, X } from 'lucide-react';

interface PrescriptionFormProps {
  onSubmit: (prescription: any) => void;
  onCancel: () => void;
  editingPrescription?: Prescription | null;
}

export function PrescriptionForm({ onSubmit, onCancel, editingPrescription }: PrescriptionFormProps) {
  const { doctors, patients, practices, getNextPrescriptionNumber, addPrescription, updatePrescription } = useData();
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
    }
  }, [editingPrescription]);

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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6 text-primary-600" />
        <h2 className="text-xl font-semibold text-gray-900">
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
              className={`p-3 rounded-lg border-2 transition-colors ${
                prescriptionType === 'studies'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium">Estudios</div>
              <div className="text-xs text-gray-500">Autorización de estudios</div>
            </button>
            <button
              type="button"
              onClick={() => setPrescriptionType('treatments')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                prescriptionType === 'treatments'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium">Tratamientos</div>
              <div className="text-xs text-gray-500">Procedimientos láser</div>
            </button>
            <button
              type="button"
              onClick={() => setPrescriptionType('authorization')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                prescriptionType === 'authorization'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium">Autorización</div>
              <div className="text-xs text-gray-500">Cirugías</div>
            </button>
          </div>
        </div>

        {/* Médico */}
        <AutoComplete
          options={doctorOptions}
          value={doctorSearch}
          onChange={handleDoctorChange}
          placeholder="Buscar médico..."
          label="Médico"
        />

        {/* Paciente */}
        <AutoComplete
          options={patientOptions}
          value={patientSearch}
          onChange={handlePatientChange}
          placeholder="Buscar paciente..."
          label="Paciente"
        />

        {/* Prácticas en formato de grid como el PDF */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Solicito:
          </label>
          
          {/* Grid de prácticas */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-2 gap-8">
              {/* Columna izquierda */}
              <div className="space-y-2">
                {leftColumnPractices.map((practice) => (
                  <div key={practice.id} className="flex items-center justify-between text-sm">
                    <span className={`flex-1 ${selectedPractices[practice.id] ? 'font-semibold text-primary-700' : 'text-gray-700'}`}>
                      {practice.name.toUpperCase()}
                    </span>
                    <div className="flex gap-1 ml-2">
                      {(['AO', 'OI', 'OD'] as const).map((ao) => (
                        <button
                          key={ao}
                          type="button"
                          onClick={() => handlePracticeToggle(practice.id, ao)}
                          className={`w-8 h-6 border border-gray-400 text-xs font-bold transition-colors flex items-center justify-center ${
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
              <div className="space-y-2">
                {rightColumnPractices.map((practice) => (
                  <div key={practice.id} className="flex items-center justify-between text-sm">
                    <span className={`flex-1 ${selectedPractices[practice.id] ? 'font-semibold text-primary-700' : 'text-gray-700'}`}>
                      {practice.name.toUpperCase()}
                    </span>
                    <div className="flex gap-1 ml-2">
                      {(['AO', 'OI', 'OD'] as const).map((ao) => (
                        <button
                          key={ao}
                          type="button"
                          onClick={() => handlePracticeToggle(practice.id, ao)}
                          className={`w-8 h-6 border border-gray-400 text-xs font-bold transition-colors flex items-center justify-center ${
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
        <div className="flex gap-4 pt-6">
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