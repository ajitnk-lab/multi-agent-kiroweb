/**
 * Represents a single todo item stored in DynamoDB.
 */
export interface TodoItem {
  /** Unique identifier in UUID v4 format */
  id: string;
  /** Title of the todo item (1-255 characters, trimmed) */
  title: string;
  /** Optional description (max 1024 characters), null if not provided */
  description: string | null;
  /** Current status of the todo item */
  status: 'incomplete' | 'complete';
  /** ISO 8601 UTC timestamp when the item was created */
  createdAt: string;
  /** ISO 8601 UTC timestamp when the item was last updated */
  updatedAt: string;
}

/**
 * Request body for creating a new todo item (POST /todos).
 */
export interface CreateTodoRequest {
  /** Title of the todo item (required, 1-255 characters) */
  title: string;
  /** Optional description (max 1024 characters) */
  description?: string;
}

/**
 * Request body for updating an existing todo item (PUT /todos/{id}).
 * At least one field must be provided.
 */
export interface UpdateTodoRequest {
  /** Updated title (1-255 characters) */
  title?: string;
  /** Updated description (max 1024 characters) */
  description?: string;
  /** Updated status */
  status?: 'incomplete' | 'complete';
}

/**
 * Standard API error response format.
 */
export interface ApiErrorResponse {
  error: true;
  message: string;
}

/**
 * Validation result type.
 */
export type ValidationResult = 
  | { valid: true }
  | { valid: false; message: string };
