import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { SocialWork } from '../types';
import { Plus, Edit3, Trash2, Building2, Search, X, AlertTriangle } from 'lucide-react';

// Componente Skeleton para la lista de obras sociales
const SkeletonSocialWorkCard = () => (
  <div className="border border-gray-200 rounded-lg p-3 sm:p-4 animate-pulse">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-5 w-32 bg-gray-200 rounded"></div>
          <div className="h-6 w-12 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-4 w-48 bg-gray-200 rounded"></div>
      </div>
      <div className="flex gap-2 sm:ml-4">
        <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
        <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  </div>
);

export function SocialWorkManager() {
  const { socialWorks, addSocialWork, updateSocialWork, deleteSocialWork, loadingSocialWorks, loadSocialWorks } = useData();
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSocialWork, setEditingSocialWork] = useState<SocialWork | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [socialWorkToDelete, setSocialWorkToDelete] = useState<SocialWork | null>(null);
  const [showDeletePlanModal, setShowDeletePlanModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<any>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    code: '',
    description: ''
  });

  // Cargar obras sociales cuando se monta el componente
  useEffect(() => {
    loadSocialWorks();
  }, []);

  const filteredSocialWorks = socialWorks.filter(socialWork =>
    socialWork.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (socialWork.code && socialWork.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const handleAsync = async () => {
      try {
        await addSocialWork(formData);
        resetForm();
      } catch (error) {
        console.error('Error saving social work:', error);
        setErrorMessage('Error al guardar la obra social. Por favor, intente nuevamente.');
        setShowErrorModal(true);
      }
    };
    
    handleAsync();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSocialWork) return;
    
    const handleAsync = async () => {
      try {
        await updateSocialWork(editingSocialWork.id, editFormData);
        resetEditForm();
      } catch (error) {
        console.error('Error updating social work:', error);
        setErrorMessage('Error al actualizar la obra social. Por favor, intente nuevamente.');
        setShowErrorModal(true);
      }
    };
    
    handleAsync();
  };
  const handleEdit = (socialWork: SocialWork) => {
    setEditingSocialWork(socialWork);
    setEditFormData({
      name: socialWork.name,
      code: socialWork.code || '',
      description: socialWork.description || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (socialWork: SocialWork) => {
    setSocialWorkToDelete(socialWork);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!socialWorkToDelete) return;
    
    try {
      await deleteSocialWork(socialWorkToDelete.id);
      setShowDeleteModal(false);
      setSocialWorkToDelete(null);
    } catch (error) {
      console.error('Error deleting social work:', error);
      setShowDeleteModal(false);
      setSocialWorkToDelete(null);
      setErrorMessage('Error al eliminar la obra social. Verifique que no esté siendo utilizada por pacientes.');
      setShowErrorModal(true);
    }
  };

  const handleDeletePlanConfirm = async () => {
    if (!planToDelete) return;
    
    try {
      await deleteSocialWorkPlan(planToDelete.id);
      setShowDeletePlanModal(false);
      setPlanToDelete(null);
    } catch (error) {
      console.error('Error deleting social work plan:', error);
      setShowDeletePlanModal(false);
      setPlanToDelete(null);
      setErrorMessage('Error al eliminar el plan. Verifique que no esté siendo utilizado por pacientes.');
      setShowErrorModal(true);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: ''
    });
    setShowForm(false);
  };

  const resetEditForm = () => {
    setEditFormData({
      name: '',
      code: '',
      description: ''
    });
    setEditingSocialWork(null);
    setShowEditModal(false);
  };
  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Gestión de Obras Sociales</h2>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva Obra Social</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        </div>

        {showForm && (
          <div className="mb-6 bg-gray-50 p-3 sm:p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Nueva Obra Social
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
                  Crear
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
          {loadingSocialWorks ? (
            // Mostrar skeletons mientras carga
            [...Array(4)].map((_, index) => (
              <SkeletonSocialWorkCard key={index} />
            ))
          ) : filteredSocialWorks.length === 0 ? (
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
              <div key={socialWork.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">{socialWork.name}</h3>
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
                  <div className="flex gap-2 sm:ml-4">
                    <button
                      onClick={() => handleEdit(socialWork)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(socialWork)}
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

      {/* Modal de Edición */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Editar Obra Social
              </h3>
              <button
                onClick={resetEditForm}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
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
                    value={editFormData.code}
                    onChange={(e) => setEditFormData({...editFormData, code: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="OSDE, SWISS, IOMA"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descripción de la obra social..."
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Actualizar Obra Social
                </button>
                <button
                  type="button"
                  onClick={resetEditForm}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && socialWorkToDelete && (
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
                ¿Está seguro que desea eliminar la obra social <strong>{socialWorkToDelete.name}</strong>?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSocialWorkToDelete(null);
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

      {/* Modal de confirmación de eliminación de plan */}
      {showDeletePlanModal && planToDelete && (
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
                ¿Está seguro que desea eliminar el plan <strong>{planToDelete.name}</strong>?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeletePlanModal(false);
                    setPlanToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeletePlanConfirm}
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
    </>
  );
}