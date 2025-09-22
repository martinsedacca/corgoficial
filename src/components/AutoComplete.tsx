import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface Option {
  id: string;
  label: string;
  value: any;
}

interface AutoCompleteProps {
  options: Option[];
  value: string;
  onChange: (value: string, option?: Option) => void;
  placeholder: string;
  label: string;
  onCreateNew?: (value: string) => void;
  createNewLabel?: string;
  disabled?: boolean;
}

export function AutoComplete({ options, value, onChange, placeholder, label, onCreateNew, createNewLabel, disabled = false }: AutoCompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: Option) => {
    onChange(option.label, option);
    setFilter('');
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    setFilter(inputValue);
    setIsOpen(true);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
          {filteredOptions.length === 0 ? (
            <div>
              <div className="px-3 py-2 text-gray-500 text-sm">
                No se encontraron resultados
              </div>
              {onCreateNew && value.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    onCreateNew(value.trim());
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-primary-50 focus:bg-primary-50 focus:outline-none border-t border-gray-200 text-primary-600 font-medium text-sm"
                >
                  + {createNewLabel || 'Crear nuevo'}: "{value.trim()}"
                </button>
              )}
            </div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 text-sm"
              >
                <div className="font-medium">{option.label}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}