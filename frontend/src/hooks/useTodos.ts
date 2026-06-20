import { useState, useEffect, useCallback } from 'react';
import { TodoItem, CreateTodoRequest, UpdateTodoRequest } from '../types/todo';
import * as todoApi from '../services/todoApi';
import { ApiError } from '../services/todoApi';

interface UseTodosReturn {
  todos: TodoItem[];
  loading: boolean;
  error: string | null;
  addTodo: (request: CreateTodoRequest) => Promise<void>;
  updateTodo: (id: string, request: UpdateTodoRequest) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
  removeTodo: (id: string) => Promise<void>;
  clearError: () => void;
}

export function useTodos(): UseTodosReturn {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: unknown): void => {
    if (err instanceof ApiError) {
      if (err.statusCode >= 500) {
        setError('Server error, please try again');
      } else {
        setError(err.message);
      }
    } else if (err instanceof DOMException && err.name === 'AbortError') {
      setError('Request timed out, please try again');
    } else if (err instanceof TypeError) {
      setError('Unable to connect to server');
    } else {
      setError('An unexpected error occurred');
    }
  };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch todos on mount
  useEffect(() => {
    const fetchTodos = async () => {
      setLoading(true);
      setError(null);
      try {
        const items = await todoApi.listTodos();
        setTodos(items);
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTodos();
  }, []);

  const addTodo = useCallback(async (request: CreateTodoRequest) => {
    setLoading(true);
    setError(null);
    try {
      const newItem = await todoApi.createTodo(request);
      setTodos(prev => [newItem, ...prev]);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTodo = useCallback(async (id: string, request: UpdateTodoRequest) => {
    setLoading(true);
    setError(null);
    
    // Optimistic update
    const previousTodos = [...todos];
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...request } as TodoItem : t));
    
    try {
      const updatedItem = await todoApi.updateTodo(id, request);
      setTodos(prev => prev.map(t => t.id === id ? updatedItem : t));
    } catch (err) {
      // Rollback on error
      setTodos(previousTodos);
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [todos]);

  const toggleStatus = useCallback(async (id: string) => {
    const item = todos.find(t => t.id === id);
    if (!item) return;
    
    const newStatus = item.status === 'complete' ? 'incomplete' : 'complete';
    await updateTodo(id, { status: newStatus });
  }, [todos, updateTodo]);

  const removeTodo = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    // Optimistic removal
    const previousTodos = [...todos];
    setTodos(prev => prev.filter(t => t.id !== id));
    
    try {
      await todoApi.deleteTodo(id);
    } catch (err) {
      // Rollback on error
      setTodos(previousTodos);
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [todos]);

  return {
    todos,
    loading,
    error,
    addTodo,
    updateTodo,
    toggleStatus,
    removeTodo,
    clearError
  };
}
