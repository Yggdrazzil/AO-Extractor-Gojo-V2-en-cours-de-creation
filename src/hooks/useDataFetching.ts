import { useState, useEffect, useCallback } from 'react';

interface UseDataFetchingOptions<T> {
  fetchFunction: () => Promise<T[]>;
  dependencies?: any[];
  initialData?: T[];
  onError?: (error: Error) => void;
}

interface UseDataFetchingReturn<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook personnalisé pour récupérer des données avec gestion d'état
 * @param options - Options de configuration
 * @returns État et fonctions pour gérer les données
 */
export function useDataFetching<T>({
  fetchFunction,
  dependencies = [],
  initialData = [],
  onError
}: UseDataFetchingOptions<T>): UseDataFetchingReturn<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      console.error('Data fetching error:', err);
      const errorObj = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(errorObj);
      if (onError) {
        onError(errorObj);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, onError]);

  useEffect(() => {
    fetchData();
  }, [...dependencies, fetchData]);

  return { data, loading, error, refetch: fetchData };
}