import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour gérer le stockage local avec typage
 * @param key - Clé de stockage
 * @param initialValue - Valeur initiale
 * @returns [storedValue, setValue] - Valeur stockée et fonction pour la mettre à jour
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Fonction pour récupérer la valeur initiale
  const readValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  // État pour stocker la valeur
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Fonction pour mettre à jour la valeur
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permettre la mise à jour via une fonction
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Sauvegarder l'état
      setStoredValue(valueToStore);
      
      // Sauvegarder dans localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Écouter les changements de localStorage dans d'autres onglets/fenêtres
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue) as T);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

/**
 * Hook pour récupérer une valeur du localStorage spécifique à un utilisateur
 * @param baseKey - Clé de base
 * @param userEmail - Email de l'utilisateur
 * @param initialValue - Valeur initiale
 * @returns [storedValue, setValue] - Valeur stockée et fonction pour la mettre à jour
 */
export function useUserLocalStorage<T>(
  baseKey: string,
  userEmail: string | null,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const userKey = userEmail ? `${baseKey}_${userEmail}` : baseKey;
  return useLocalStorage<T>(userKey, initialValue);
}