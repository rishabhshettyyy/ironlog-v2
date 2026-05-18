/* ══════════════════════════════════════════════
   client/src/hooks/useExercises.js
   Centralises exercise fetch logic so multiple
   components share the same data + loading state.
   Author: Rishabh
══════════════════════════════════════════════ */
import { useState, useCallback } from 'react';
import { exerciseApi } from '../services/api';

export function useExercises() {
  const [exercises, setExercises] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  const fetchByDate = useCallback(async (date) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await exerciseApi.getByDate(date);
      setExercises(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load exercises');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAll = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await exerciseApi.getAll(params);
      setExercises(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load exercises');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { exercises, setExercises, loading, error, fetchByDate, fetchAll };
}
