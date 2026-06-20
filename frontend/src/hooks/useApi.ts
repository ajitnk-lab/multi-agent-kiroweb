import { useState, useCallback } from 'react';
import { ApiError } from '../services/todoApi';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: unknown[]) => Promise<T | undefined>;
  clearError: () => void;
}

export function useApi<T>(): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const execute = useCallback(async (apiCall: () => Promise<T>): Promise<T | undefined> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await apiCall();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (err) {
      let errorMessage = 'Unable to connect to server';
      
      if (err instanceof ApiError) {
        if (err.statusCode >= 500) {
          errorMessage = 'Server error, please try again';
        } else {
          errorMessage = err.message;
        }
      } else if (err instanceof DOMException && err.name === 'AbortError') {
        errorMessage = 'Request timed out, please try again';
      } else if (err instanceof TypeError) {
        errorMessage = 'Unable to connect to server';
      }
      
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return undefined;
    }
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute: execute as (...args: unknown[]) => Promise<T | undefined>,
    clearError
  };
}
