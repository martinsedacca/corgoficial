import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { SocialWork } from '../types';
import { Plus, Edit3, Trash2, Building2, Search } from 'lucide-react';

export function SocialWorkManager() {
  const { socialWorks, addSocialWork, updateSocialWork, deleteSocialWork } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingSocialWork, setEditingSocialWork] = useState<SocialWork | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });

  const filteredSocialWorks = socialWorks.filter(socialWork =>
    socialWork.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (socialWork.code && socialWork.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const handleAsync = async () => {
      try {
        if (editingSocialWork) {
          await updateSocialWork(editingSocialWork.id, formData);
        } else {
          await addSocialWork(formData);
        }
        resetForm();
      } catch (error) {
        console.error('Error saving social work:', error);
        alert('Error al guardar la obra social. Por favor, intente nuevamente.');
      }
    };
    
    handleAsync();
  };

  const handleEdit = (socialWork: SocialWork) => {
    setEditingSocialWork(socialWork);
    setFormData({
      name: socialWork.name,
      code: socialWork.code || '',
      description: socialWork.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar esta obra social?')) {
      try {
        await deleteSocialWork(id);
      } catch (error) {
        console.error('Error deleting social work:', error);
        alert('Error al eliminar la obra social. Verifique que no esté siendo utilizada por pacientes.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: ''
    });
    setEditingSocialWork(null);
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Gestión de Obras Sociales</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva Obra Social
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingSocialWork ? 'Editar Obra Social' : 'Nueva Obra Social'}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="OSDE, Swiss Medical, IOMA, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="OSDE, SWISS, IOMA"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descripción de la obra social..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingSocialWork ? 'Actualizar' : 'Crear'}
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

      {/* Filtros */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar obras sociales por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredSocialWorks.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {searchTerm 
                ? 'No se encontraron obras sociales con ese criterio'
                : 'No hay obras sociales registradas'
              }
            </p>
          </div>
        ) : (
          filteredSocialWorks.map((socialWork) => (
            <div key={socialWork.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{socialWork.name}</h3>
                    {socialWork.code && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-mono">
                        {socialWork.code}
                      </span>
                    )}
                  </div>
                  {socialWork.description && (
                    <p className="text-sm text-gray-600">{socialWork.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(socialWork)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(socialWork.id)}
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

      {filteredSocialWorks.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Mostrando {filteredSocialWorks.length} de {socialWorks.length} obras sociales
        </div>
      )}
    </div>
  );
}