import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Practice } from '../types';
import { Plus, Edit3, Trash2, Activity, Search, Save, X, AlertCircle, AlertTriangle } from 'lucide-react';

// Componente Skeleton para la lista de prácticas
const SkeletonPracticeCard = () => (
  <div className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors animate-pulse">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-5 w-48 bg-gray-200 rounded"></div>
          <div className="h-6 w-12 bg-gray-200 rounded"></div>
        </div>
        <div className="h-4 w-64 bg-gray-200 rounded"></div>
      </div>
      <div className="flex gap-2 sm:ml-4">
        <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
        <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  </div>
);

// Componente Skeleton para secciones de categorías
const SkeletonCategorySection = () => (
  <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="h-6 w-32 bg-gray-200 rounded-full"></div>
    </div>
    <div className="grid gap-3">
      {[...Array(3)].map((_, index) => (
        <SkeletonPracticeCard key={index} />
      ))}
    </div>
  </div>
);

export function PracticeAdmin() {
  const { practices, addPractice, updatePractice, deletePractice, loadingPractices, loadPractices } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingPractice, setEditingPractice] = useState<Practice | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [practiceToDelete, setPracticeToDelete] = useState<Practice | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'study' as Practice['category'],
    description: ''
  });

  // Cargar prácticas cuando se monta el componente
  useEffect(() => {
    loadPractices();
  }, []);

  const categoryLabels = {
    study: 'Estudio',
    treatment: 'Tratamiento',
    surgery: 'Cirugía'
  };

  const categoryColors = {
    study: 'bg-blue-100 text-blue-800 border-blue-200',
    treatment: 'bg-green-100 text-green-800 border-green-200',
    surgery: 'bg-purple-100 text-purple-800 border-purple-200'
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
    
    // Validar que el código no esté duplicado
    const existingPractice = practices.find(p => 
      p.code.toUpperCase() === formData.code.toUpperCase() && 
      p.id !== editingPractice?.id
    );
    
    if (existingPractice) {
      setErrorMessage('Ya existe una práctica con ese código. Por favor, use un código diferente.');
      setShowErrorModal(true);
      return;
    }

    const handleAsync = async () => {
      try {
        if (editingPractice) {
          await updatePractice(editingPractice.id, formData);
        } else {
          await addPractice(formData);
        }
        resetForm();
      } catch (error) {
        console.error('Error saving practice:', error);
        setErrorMessage('Error al guardar la práctica. Por favor, intente nuevamente.');
        setShowErrorModal(true);
      }
    };
    
    handleAsync();
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

  const handleDeleteClick = (practice: Practice) => {
    setPracticeToDelete(practice);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!practiceToDelete) return;
    
    try {
      await deletePractice(practiceToDelete.id);
      setShowDeleteModal(false);
      setPracticeToDelete(null);
    } catch (error) {
      console.error('Error deleting practice:', error);
      setShowDeleteModal(false);
      setPracticeToDelete(null);
      setErrorMessage('Error al eliminar la práctica. Verifique que no esté siendo utilizada en recetas.');
      setShowErrorModal(true);
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

  const practicesByCategory = {
    study: filteredPractices.filter(p => p.category === 'study'),
    treatment: filteredPractices.filter(p => p.category === 'treatment'),
    surgery: filteredPractices.filter(p => p.category === 'surgery')
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Activity className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Administración de Prácticas Médicas</h1>
              <p className="text-sm sm:text-base text-gray-600">Gestione estudios, tratamientos y cirugías</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm sm:text-base"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">Nueva Práctica</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{practices.length}</div>
            <div className="text-sm text-gray-600">Total de Prácticas</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-blue-700">{practicesByCategory.study.length}</div>
            <div className="text-sm text-blue-600">Estudios</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-green-700">{practicesByCategory.treatment.length}</div>
            <div className="text-sm text-green-600">Tratamientos</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-purple-700">{practicesByCategory.surgery.length}</div>
            <div className="text-sm text-purple-600">Cirugías</div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="h-6 w-6 text-purple-600" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {editingPractice ? 'Editar Práctica' : 'Nueva Práctica'}
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Práctica *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Ej: Campo Visual Computarizado"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono"
                  placeholder="Ej: CVC"
                  maxLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">Código único para identificar la práctica</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value as Practice['category']})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="study">Estudio</option>
                  <option value="treatment">Tratamiento</option>
                  <option value="surgery">Cirugía</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Descripción detallada de la práctica médica..."
                rows={3}
              />
            </div>
            
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                <Save className="h-5 w-5" />
                {editingPractice ? 'Actualizar Práctica' : 'Crear Práctica'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-2 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-400 transition-colors"
              >
                <X className="h-5 w-5" />
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar prácticas por nombre, código o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">Todas las categorías</option>
              <option value="study">Estudios</option>
              <option value="treatment">Tratamientos</option>
              <option value="surgery">Cirugías</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Prácticas por Categoría */}
      {loadingPractices ? (
        // Mostrar skeletons mientras carga
        [...Array(3)].map((_, index) => (
          <SkeletonCategorySection key={index} />
        ))
      ) : (
        Object.entries(practicesByCategory).map(([category, categoryPractices]) => {
          if (filterCategory !== 'all' && filterCategory !== category) return null;
          if (categoryPractices.length === 0) return null;

          return (
            <div key={category} className="bg-white rounded-lg shadow-lg p-3 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColors[category as keyof typeof categoryColors]}`}>
                  {categoryLabels[category as keyof typeof categoryLabels]} ({categoryPractices.length})
                </div>
              </div>
              
              <div className="grid gap-3">
                {categoryPractices.map((practice) => (
                  <div key={practice.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{practice.name}</h3>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-mono">
                            {practice.code}
                          </span>
                        </div>
                        {practice.description && (
                          <p className="text-sm text-gray-600">{practice.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 sm:ml-4">
                        <button
                          onClick={() => handleEdit(practice)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Editar práctica"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(practice)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar práctica"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Estado vacío */}
      {!loadingPractices && filteredPractices.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterCategory !== 'all' 
              ? 'No se encontraron prácticas'
              : 'No hay prácticas registradas'
            }
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterCategory !== 'all' 
              ? 'Intente ajustar los filtros de búsqueda'
              : 'Comience agregando estudios, tratamientos y cirugías'
            }
          </p>
          {!searchTerm && filterCategory === 'all' && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors mx-auto"
            >
              <Plus className="h-5 w-5" />
              Agregar Primera Práctica
            </button>
          )}
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && practiceToDelete && (
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
                ¿Está seguro que desea eliminar la práctica <strong>"{practiceToDelete.name}"</strong>?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPracticeToDelete(null);
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