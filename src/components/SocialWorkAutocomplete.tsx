import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { SocialWork } from '../types';
import { ChevronDown, Search, Plus } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';

interface SocialWorkAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export function SocialWorkAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Buscar obra social...", 
  label = "Obra Social",
  required = false,
  disabled = false
}: SocialWorkAutocompleteProps) {
  const { socialWorks, addSocialWork } = useData();
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = socialWorks.filter(socialWork =>
    socialWork.name.toLowerCase().includes(filter.toLowerCase()) ||
    (socialWork.code && socialWork.code.toLowerCase().includes(filter.toLowerCase()))
  ).sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (socialWork: SocialWork) => {
    onChange(socialWork.name);
    setFilter('');
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    setFilter(inputValue);
    setIsOpen(true);
  };

  const handleCreateNew = async (name: string) => {
    try {
      await addSocialWork({ name: name.trim(), code: '', description: '' });
      onChange(name.trim());
      setIsOpen(false);
      setFilter('');
    } catch (error) {
      console.error('Error creating social work:', error);
      setErrorMessage('Error al crear la obra social. Por favor, intente nuevamente.');
      setShowErrorModal(true);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 hover:text-gray-600"
        >
          <ChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div>
              <div className="px-3 py-2 text-gray-500 text-sm">
                No se encontraron obras sociales
              </div>
              {value.trim() && (
                <button
                  type="button"
                  onClick={() => handleCreateNew(value.trim())}
                  className="w-full px-3 py-2 text-left hover:bg-primary-50 focus:bg-primary-50 focus:outline-none border-t border-gray-200 text-primary-600 font-medium flex items-center gap-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Crear nueva obra social: "{value.trim()}"
                </button>
              )}
            </div>
          ) : (
            <>
              {filteredOptions.map((socialWork) => (
                <button
                  key={socialWork.id}
                  type="button"
                  onClick={() => handleSelect(socialWork)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{socialWork.name}</div>
                    {socialWork.code && (
                      <div className="text-xs text-gray-500 font-mono">{socialWork.code}</div>
                    )}
                  </div>
                  {socialWork.description && (
                    <div className="text-xs text-gray-500 mt-1">{socialWork.description}</div>
                  )}
                </button>
              ))}
              {value.trim() && !filteredOptions.some(sw => sw.name.toLowerCase() === value.trim().toLowerCase()) && (
                <button
                  type="button"
                  onClick={() => handleCreateNew(value.trim())}
                  className="w-full px-3 py-2 text-left hover:bg-primary-50 focus:bg-primary-50 focus:outline-none border-t border-gray-200 text-primary-600 font-medium flex items-center gap-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Crear nueva obra social: "{value.trim()}"
                </button>
              )}
            </>
          )}
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