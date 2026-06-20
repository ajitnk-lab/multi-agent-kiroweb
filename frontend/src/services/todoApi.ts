import { TodoItem, CreateTodoRequest, UpdateTodoRequest, ApiErrorResponse } from '../types/todo';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TIMEOUT_MS = 30000;

class ApiError extends Error {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'An error occurred';
    try {
      const errorBody: ApiErrorResponse = await response.json();
      message = errorBody.message;
    } catch {
      if (response.status >= 500) {
        message = 'Server error, please try again';
      }
    }
    throw new ApiError(response.status, message);
  }
  return response.json() as Promise<T>;
}

export async function createTodo(request: CreateTodoRequest): Promise<TodoItem> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  return handleResponse<TodoItem>(response);
}

export async function listTodos(): Promise<TodoItem[]> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/todos`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  return handleResponse<TodoItem[]>(response);
}

export async function updateTodo(id: string, request: UpdateTodoRequest): Promise<TodoItem> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/todos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  return handleResponse<TodoItem>(response);
}

export async function deleteTodo(id: string): Promise<{ id: string }> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/todos/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
  return handleResponse<{ id: string }>(response);
}

export { ApiError };
