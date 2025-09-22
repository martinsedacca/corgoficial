import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Loader2 } from 'lucide-react';

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
  onSearch?: (searchTerm: string) => Promise<Option[]>;
  minSearchLength?: number;
  searchPlaceholder?: string;
}

export function AutoComplete({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  label, 
  onCreateNew, 
  createNewLabel, 
  disabled = false,
  onSearch,
  minSearchLength = 3,
  searchPlaceholder
}: AutoCompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [searchResults, setSearchResults] = useState<Option[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Usar resultados de búsqueda si están disponibles, sino usar opciones filtradas
  const displayOptions = onSearch && hasSearched ? searchResults : options.filter(option =>
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

  // Efecto para búsqueda con debounce
  useEffect(() => {
    if (!onSearch || filter.length < minSearchLength) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await onSearch(filter);
        setSearchResults(results);
        setHasSearched(true);
      } catch (error) {
        console.error('Error searching:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filter, onSearch, minSearchLength]);

  const handleSelect = (option: Option) => {
    onChange(option.label, option);
    setFilter('');
    setIsOpen(false);
    setHasSearched(false);
    setSearchResults([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    setFilter(inputValue);
    setIsOpen(true);
  };

  const handleCreateNew = () => {
    if (onCreateNew && value.trim()) {
      onCreateNew(value.trim());
      setIsOpen(false);
    }
  };

  const showMinLengthMessage = onSearch && filter.length > 0 && filter.length < minSearchLength;
  const showNoResults = displayOptions.length === 0 && !isSearching && !showMinLengthMessage;

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
          placeholder={searchPlaceholder || placeholder}
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
          {isSearching ? (
            <div className="px-3 py-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                <span className="text-sm text-gray-600">Buscando...</span>
              </div>
            </div>
          ) : showMinLengthMessage ? (
            <div className="px-3 py-4 text-center">
              <div className="text-sm text-gray-500">
                Escriba al menos {minSearchLength} caracteres para buscar
              </div>
            </div>
          ) : showNoResults ? (
            <div>
              <div className="px-3 py-2 text-gray-500 text-sm">
                No se encontraron resultados
              </div>
              {onCreateNew && value.trim() && (
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="w-full px-3 py-2 text-left hover:bg-primary-50 focus:bg-primary-50 focus:outline-none border-t border-gray-200 text-primary-600 font-medium text-sm"
                >
                  + {createNewLabel || 'Crear nuevo'}: "{value.trim()}"
                </button>
              )}
            </div>
          ) : (
            <>
              {displayOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 text-sm leading-relaxed"
                >
                  <div className="font-medium break-words">{option.label}</div>
                </button>
              ))}
              {onSearch && hasSearched && searchResults.length > 0 && (
                <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
                  Mostrando {searchResults.length} resultados
                </div>
              )}
              {onCreateNew && value.trim() && !displayOptions.some(opt => opt.label.toLowerCase() === value.trim().toLowerCase()) && (
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="w-full px-3 py-2 text-left hover:bg-primary-50 focus:bg-primary-50 focus:outline-none border-t border-gray-200 text-primary-600 font-medium text-sm"
                >
                  + {createNewLabel || 'Crear nuevo'}: "{value.trim()}"
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}