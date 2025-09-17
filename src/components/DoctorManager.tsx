import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Doctor } from '../types';
import { UserPlus, Edit3, Trash2, User, Phone, Mail } from 'lucide-react';

export function DoctorManager() {
  const { doctors, addDoctor, updateDoctor, deleteDoctor } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    license: '',
    phone: '',
    email: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const handleAsync = async () => {
      try {
        if (editingDoctor) {
          await updateDoctor(editingDoctor.id, formData);
        } else {
          await addDoctor(formData);
        }
        resetForm();
      } catch (error) {
        console.error('Error saving doctor:', error);
        alert('Error al guardar el médico. Por favor, intente nuevamente.');
      }
    };
    
    handleAsync();
  };

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.name,
      specialty: doctor.specialty,
      license: doctor.license,
      phone: doctor.phone || '',
      email: doctor.email || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este médico?')) {
      try {
        await deleteDoctor(id);
      } catch (error) {
        console.error('Error deleting doctor:', error);
        alert('Error al eliminar el médico. Verifique que no tenga recetas asociadas.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      specialty: '',
      license: '',
      phone: '',
      email: ''
    });
    setEditingDoctor(null);
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <User className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">Gestión de Médicos</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo Médico
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingDoctor ? 'Editar Médico' : 'Nuevo Médico'}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Dr. Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especialidad *
                </label>
                <input
                  type="text"
                  required
                  value={formData.specialty}
                  onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Oftalmología"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Matrícula Profesional *
                </label>
                <input
                  type="text"
                  required
                  value={formData.license}
                  onChange={(e) => setFormData({...formData, license: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="M.P. 1234"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="02966 123456"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="doctor@email.com"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                {editingDoctor ? 'Actualizar' : 'Crear'}
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
        {doctors.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay médicos registrados</p>
          </div>
        ) : (
          doctors.map((doctor) => (
            <div key={doctor.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
                    <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                      {doctor.specialty}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Matrícula:</strong> {doctor.license}</p>
                    {doctor.phone && (
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {doctor.phone}
                      </p>
                    )}
                    {doctor.email && (
                      <p className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {doctor.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(doctor)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doctor.id)}
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