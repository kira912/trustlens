import { useState, useCallback } from 'react';
import { apiClient } from '../../../core/infrastructure/api.client';
import type { SirenSearchResponse } from '../../../core/domain/models';

export function useSiretSearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SirenSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchSiret = useCallback(async (overrideQuery?: string) => {
    const q = (overrideQuery ?? query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const json = await apiClient.verifySiren(q);
      setData(json);
      if (overrideQuery) setQuery(overrideQuery);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  }, [query]);

  return {
    query,
    setQuery,
    loading,
    data,
    error,
    searchSiret,
  };
}
