'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';

export interface ApiHookResult<T> {
  data: T | null;
  loading: boolean;
  error: string;
  refresh: () => void;
}

export function useApi<T>(path: string | null): ApiHookResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!path) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    apiFetch<T>(path)
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
        }
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }

        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to load data.');
        }
        setData(null);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [path, refreshKey]);

  return {
    data,
    loading,
    error,
    refresh: () => setRefreshKey((current) => current + 1),
  };
}
