import { renderHook, act, waitFor } from '@testing-library/react';
import { useTodos } from '../../src/hooks/useTodos';
import { TodoItem } from '../../src/types/todo';

// Mock the todoApi module
jest.mock('../../src/services/todoApi', () => ({
  listTodos: jest.fn(),
  createTodo: jest.fn(),
  updateTodo: jest.fn(),
  deleteTodo: jest.fn(),
  ApiError: class ApiError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
      super(message);
      this.name = 'ApiError';
      this.statusCode = statusCode;
    }
  }
}));

import * as todoApi from '../../src/services/todoApi';
const { ApiError } = todoApi as any;

const mockTodo: TodoItem = {
  id: '123e4567-e89b-4d3c-a456-426614174000',
  title: 'Test Todo',
  description: null,
  status: 'incomplete',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
};

const mockTodo2: TodoItem = {
  id: '223e4567-e89b-4d3c-a456-426614174001',
  title: 'Second Todo',
  description: 'A description',
  status: 'complete',
  createdAt: '2024-01-02T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z'
};

describe('useTodos hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (todoApi.listTodos as jest.Mock).mockResolvedValue([mockTodo]);
  });

  it('should load todos on mount', async () => {
    const { result } = renderHook(() => useTodos());

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(todoApi.listTodos).toHaveBeenCalledTimes(1);
    expect(result.current.todos).toEqual([mockTodo]);
    expect(result.current.error).toBeNull();
  });

  it('should add a todo and prepend it to the list', async () => {
    (todoApi.createTodo as jest.Mock).mockResolvedValue(mockTodo2);

    const { result } = renderHook(() => useTodos());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addTodo({ title: 'Second Todo' });
    });

    expect(todoApi.createTodo).toHaveBeenCalledWith({ title: 'Second Todo' });
    // New item prepended
    expect(result.current.todos[0]).toEqual(mockTodo2);
    expect(result.current.todos[1]).toEqual(mockTodo);
  });

  it('should set error on addTodo server error (500)', async () => {
    const serverError = new ApiError(500, 'Internal Server Error');
    (todoApi.createTodo as jest.Mock).mockRejectedValue(serverError);

    const { result } = renderHook(() => useTodos());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addTodo({ title: 'Failing Todo' });
    });

    expect(result.current.error).toBe('Server error, please try again');
    // Todos should not be modified
    expect(result.current.todos).toEqual([mockTodo]);
  });

  it('should remove a todo from the list', async () => {
    (todoApi.listTodos as jest.Mock).mockResolvedValue([mockTodo, mockTodo2]);
    (todoApi.deleteTodo as jest.Mock).mockResolvedValue({ id: mockTodo.id });

    const { result } = renderHook(() => useTodos());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.todos).toHaveLength(2);
    });

    await act(async () => {
      await result.current.removeTodo(mockTodo.id);
    });

    expect(todoApi.deleteTodo).toHaveBeenCalledWith(mockTodo.id);
    expect(result.current.todos).toEqual([mockTodo2]);
  });

  it('should clear error when clearError is called', async () => {
    const serverError = new ApiError(500, 'Internal Server Error');
    (todoApi.createTodo as jest.Mock).mockRejectedValue(serverError);

    const { result } = renderHook(() => useTodos());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Trigger an error
    await act(async () => {
      await result.current.addTodo({ title: 'Failing Todo' });
    });

    expect(result.current.error).toBe('Server error, please try again');

    // Clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
