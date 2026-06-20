import { ValidationResult, UpdateTodoRequest } from '../types/todo';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates a todo title.
 * Title must be non-empty after trimming and not exceed 255 characters.
 */
export function validateTitle(title: unknown): ValidationResult {
  if (typeof title !== 'string') {
    return { valid: false, message: 'A non-empty title is required' };
  }
  
  const trimmed = title.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, message: 'A non-empty title is required' };
  }
  
  if (trimmed.length > 255) {
    return { valid: false, message: 'Title must not exceed 255 characters' };
  }
  
  return { valid: true };
}

/**
 * Validates a todo description.
 * Description is optional but must not exceed 1024 characters when provided.
 */
export function validateDescription(description: unknown): ValidationResult {
  if (description === undefined || description === null) {
    return { valid: true };
  }
  
  if (typeof description !== 'string') {
    return { valid: false, message: 'Description must be a string' };
  }
  
  if (description.length > 1024) {
    return { valid: false, message: 'Description must not exceed 1024 characters' };
  }
  
  return { valid: true };
}

/**
 * Validates a UUID v4 format identifier.
 */
export function validateId(id: unknown): ValidationResult {
  if (typeof id !== 'string' || id.trim().length === 0) {
    return { valid: false, message: 'Invalid id format' };
  }
  
  if (!UUID_V4_REGEX.test(id)) {
    return { valid: false, message: 'Invalid id format' };
  }
  
  return { valid: true };
}

/**
 * Validates an update request body.
 * At least one of title, description, or status must be provided.
 * If provided, title and description must meet their constraints.
 * Status must be "incomplete" or "complete".
 */
export function validateUpdateBody(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, message: 'Request body must be a valid object' };
  }
  
  const { title, description, status } = body as UpdateTodoRequest;
  
  const hasTitle = title !== undefined;
  const hasDescription = description !== undefined;
  const hasStatus = status !== undefined;
  
  if (!hasTitle && !hasDescription && !hasStatus) {
    return { valid: false, message: 'At least one updatable field must be provided' };
  }
  
  if (hasTitle) {
    const titleResult = validateTitle(title);
    if (!titleResult.valid) {
      return titleResult;
    }
  }
  
  if (hasDescription) {
    const descResult = validateDescription(description);
    if (!descResult.valid) {
      return descResult;
    }
  }
  
  if (hasStatus && status !== 'incomplete' && status !== 'complete') {
    return { valid: false, message: "Status must be 'incomplete' or 'complete'" };
  }
  
  return { valid: true };
}
