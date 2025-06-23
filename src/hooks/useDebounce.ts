import { useState, useEffect } from 'react';

/**
 * Hook pour débouncer une valeur
 * Utile pour éviter trop d'appels lors de la saisie dans un champ de recherche
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}