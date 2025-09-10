import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Practice } from '../types';
import { Plus, Edit3, Trash2, Activity, Search } from 'lucide-react';

export function PracticeManager() {
  const { practices, addPractice, updatePractice, deletePractice } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingPractice, setEditingPractice] = useState<Practice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'study' as Practice['category'],
    description: ''
  });

  const categoryLabels = {
    study: 'Estudio',
    treatment: 'Tratamiento',
    surgery: 'Cirugía'
  };

  const categoryColors = {
    study: 'bg-blue-100 text-blue-800',
    treatment: 'bg-green-100 text-green-800',
    surgery: 'bg-purple-100 text-purple-800'
  };

  const filteredPractices = practices.filter(practice => {
    const matchesSearch = 
      practice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      practice.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (practice.description && practice.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || practice.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPractice) {
      updatePractice(editingPractice.id, formData);
    } else {
      addPractice(formData);
    }
    resetForm();
  };

  const handleEdit = (practice: Practice) => {
    setEditingPractice(practice);
    setFormData({
      name: practice.name,
      code: practice.code,
      category: practice.category,
      description: practice.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar esta práctica?')) {
      deletePractice(id);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      category: 'study',
      description: ''
    });
    setEditingPractice(null);
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Gestión de Prácticas</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva Práctica
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingPractice ? 'Editar Práctica' : 'Nueva Práctica'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Campo Visual Computarizado"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="CVC"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value as Practice['category']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="study">Estudio</option>
                  <option value="treatment">Tratamiento</option>
                  <option value="surgery">Cirugía</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Descripción detallada de la práctica..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                {editingPractice ? 'Actualizar' : 'Crear'}
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
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar prácticas por nombre, código o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">Todas las categorías</option>
            <option value="study">Estudios</option>
            <option value="treatment">Tratamientos</option>
            <option value="surgery">Cirugías</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredPractices.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {searchTerm || filterCategory !== 'all' 
                ? 'No se encontraron prácticas con los filtros aplicados'
                : 'No hay prácticas registradas'
              }
            </p>
          </div>
        ) : (
          filteredPractices.map((practice) => (
            <div key={practice.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{practice.name}</h3>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-mono">
                      {practice.code}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-sm ${categoryColors[practice.category]}`}>
                      {categoryLabels[practice.category]}
                    </span>
                  </div>
                  {practice.description && (
                    <p className="text-sm text-gray-600">{practice.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(practice)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(practice.id)}
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

      {filteredPractices.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Mostrando {filteredPractices.length} de {practices.length} prácticas
        </div>
      )}
    </div>
  );
}