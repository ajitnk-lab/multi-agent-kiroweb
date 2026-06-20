import { TodoItem, CreateTodoRequest, UpdateTodoRequest } from '../types/todo';

/**
 * Serialize a TodoItem to a JSON-safe object.
 * Ensures null for optional fields that have no value.
 */
export function serializeTodoItem(item: TodoItem): Record<string, unknown> {
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? null,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

/**
 * Deserialize and parse a JSON string into a CreateTodoRequest.
 * Throws a descriptive error if the JSON is invalid or missing required fields.
 */
export function deserializeCreateRequest(body: string | null): CreateTodoRequest {
  if (!body) {
    throw new SerializationError('Request body must be valid JSON');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new SerializationError('Request body must be valid JSON');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new SerializationError('Request body must be a valid object');
  }

  const obj = parsed as Record<string, unknown>;
  
  return {
    title: obj.title as string,
    description: obj.description !== undefined ? (obj.description as string) : undefined
  };
}

/**
 * Deserialize and parse a JSON string into an UpdateTodoRequest.
 * Throws a descriptive error if the JSON is invalid.
 */
export function deserializeUpdateRequest(body: string | null): UpdateTodoRequest {
  if (!body) {
    throw new SerializationError('Request body must be valid JSON');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new SerializationError('Request body must be valid JSON');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new SerializationError('Request body must be a valid object');
  }

  const obj = parsed as Record<string, unknown>;
  
  const result: UpdateTodoRequest = {};
  
  if (obj.title !== undefined) {
    result.title = obj.title as string;
  }
  if (obj.description !== undefined) {
    result.description = obj.description as string;
  }
  if (obj.status !== undefined) {
    result.status = obj.status as 'incomplete' | 'complete';
  }
  
  return result;
}

/**
 * Custom error class for serialization/deserialization failures.
 */
export class SerializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SerializationError';
  }
}
