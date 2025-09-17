import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Patient } from '../types';
import { UserPlus, Edit3, Trash2, Users, Phone, Mail, MapPin } from 'lucide-react';

export function PatientManager() {
  const { patients, addPatient, updatePatient, deletePatient } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    socialWork: '',
    affiliateNumber: '',
    phone: '',
    email: '',
    address: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
        alert('Error al guardar el paciente. Por favor, intente nuevamente.');
      }
    };
    
    handleAsync();
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      name: patient.name,
      socialWork: patient.socialWork,
      affiliateNumber: patient.affiliateNumber,
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este paciente?')) {
      try {
        await deletePatient(id);
      } catch (error) {
        console.error('Error deleting patient:', error);
        alert('Error al eliminar el paciente. Verifique que no tenga recetas asociadas.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      socialWork: '',
      affiliateNumber: '',
      phone: '',
      email: '',
      address: ''
    });
    setEditingPatient(null);
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">Gestión de Pacientes</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo Paciente
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingPatient ? 'Editar Paciente' : 'Nuevo Paciente'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Juan Carlos Martínez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Obra Social *
                </label>
                <input
                  type="text"
                  required
                  value={formData.socialWork}
                  onChange={(e) => setFormData({...formData, socialWork: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="OSDE, Swiss Medical, IOMA, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Afiliado *
                </label>
                <input
                  type="text"
                  required
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
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
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

      <div className="grid gap-4">
        {patients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay pacientes registrados</p>
          </div>
        ) : (
          patients.map((patient) => (
            <div key={patient.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {patient.socialWork}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>N° Afiliado:</strong> {patient.affiliateNumber}</p>
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
                    {patient.address && (
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {patient.address}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(patient)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(patient.id)}
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
    </div>
  );
}