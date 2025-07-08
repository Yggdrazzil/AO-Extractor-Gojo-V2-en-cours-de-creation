import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  id?: string;
}

/**
 * Composant de recherche réutilisable avec debounce
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Rechercher...',
  debounceMs = 300,
  className = '',
  id = 'search-input'
}: SearchInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const debouncedValue = useDebounce(inputValue, debounceMs);

  // Mettre à jour la valeur d'entrée lorsque la valeur externe change
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Propager la valeur debounced au parent
  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleClear = () => {
    setInputValue('');
  };

  return (
    <div className={`relative flex-1 ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </div>
      
      <input
        id={id}
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      
      {inputValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Effacer la recherche"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}