import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { SocialWork, SocialWorkPlan } from '../types';
import { ChevronDown, Search, Plus } from 'lucide-react';

interface SocialWorkPlanSelectorProps {
  selectedSocialWork: SocialWork | null;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export function SocialWorkPlanSelector({ 
  selectedSocialWork,
  value, 
  onChange, 
  placeholder = "Seleccionar plan...", 
  label = "Plan",
  required = false,
  disabled = false
}: SocialWorkPlanSelectorProps) {
  const { getSocialWorkPlans, addSocialWorkPlan } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  console.log('SocialWorkPlanSelector - selectedSocialWork:', selectedSocialWork);
  const availablePlans = selectedSocialWork ? getSocialWorkPlans(selectedSocialWork.id) : [];
  console.log('SocialWorkPlanSelector - availablePlans:', availablePlans);
  
  const filteredPlans = availablePlans.filter(plan =>
    plan.name.toLowerCase().includes(filter.toLowerCase()) ||
    (plan.code && plan.code.toLowerCase().includes(filter.toLowerCase()))
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

  // Limpiar el plan seleccionado cuando cambia la obra social
  useEffect(() => {
    if (selectedSocialWork && value) {
      const planExists = availablePlans.some(plan => plan.name === value);
      if (!planExists) {
        onChange('');
      }
    }
  }, [selectedSocialWork, availablePlans, value, onChange]);

  // Auto-seleccionar si solo hay un plan disponible
  useEffect(() => {
    if (selectedSocialWork && availablePlans.length === 1 && !value) {
      const singlePlan = availablePlans[0];
      onChange(singlePlan.name);
    }
  }, [selectedSocialWork, availablePlans, value, onChange]);

  const handleSelect = (plan: SocialWorkPlan) => {
    onChange(plan.name);
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
    if (!selectedSocialWork) return;
    
    try {
      await addSocialWorkPlan({
        socialWorkId: selectedSocialWork.id,
        name: name.trim(),
        code: '',
        description: '',
        isActive: true
      });
      onChange(name.trim());
      setIsOpen(false);
      setFilter('');
    } catch (error) {
      console.error('Error creating social work plan:', error);
      alert('Error al crear el plan. Por favor, intente nuevamente.');
    }
  };

  if (!selectedSocialWork) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          disabled
          placeholder="Primero seleccione una obra social"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
        />
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="w-full px-3 py-2 pl-10 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 hover:text-gray-600"
        >
          <ChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredPlans.length === 0 ? (
            <div>
              <div className="px-3 py-2 text-gray-500 text-sm">
                No se encontraron planes para {selectedSocialWork.name}
              </div>
              {value.trim() && (
                <button
                  type="button"
                  onClick={() => handleCreateNew(value.trim())}
                  className="w-full px-3 py-2 text-left hover:bg-primary-50 focus:bg-primary-50 focus:outline-none border-t border-gray-200 text-primary-600 font-medium flex items-center gap-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Crear nuevo plan: "{value.trim()}"
                </button>
              )}
            </div>
          ) : (
            <>
              {filteredPlans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => handleSelect(plan)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{plan.name}</div>
                    {plan.code && (
                      <div className="text-xs text-gray-500 font-mono">{plan.code}</div>
                    )}
                  </div>
                  {plan.description && (
                    <div className="text-xs text-gray-500 mt-1">{plan.description}</div>
                  )}
                </button>
              ))}
              {value.trim() && !filteredPlans.some(plan => plan.name.toLowerCase() === value.trim().toLowerCase()) && (
                <button
                  type="button"
                  onClick={() => handleCreateNew(value.trim())}
                  className="w-full px-3 py-2 text-left hover:bg-primary-50 focus:bg-primary-50 focus:outline-none border-t border-gray-200 text-primary-600 font-medium flex items-center gap-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Crear nuevo plan: "{value.trim()}"
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}