import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { validateTitle, validateDescription } from '../lib/validator';
import { deserializeCreateRequest, serializeTodoItem, SerializationError } from '../lib/serializer';
import { putItem } from '../lib/dynamodb-client';
import { success, error } from '../lib/response';
import { TodoItem } from '../types/todo';

/**
 * Lambda handler for POST /todos
 * Creates a new todo item.
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Deserialize request body
    let request;
    try {
      request = deserializeCreateRequest(event.body);
    } catch (err) {
      if (err instanceof SerializationError) {
        return error(400, err.message);
      }
      return error(400, 'Request body must be valid JSON');
    }

    // Validate title
    const titleResult = validateTitle(request.title);
    if (!titleResult.valid) {
      return error(400, titleResult.message);
    }

    // Validate description if provided
    if (request.description !== undefined) {
      const descResult = validateDescription(request.description);
      if (!descResult.valid) {
        return error(400, descResult.message);
      }
    }

    // Create the todo item
    const now = new Date().toISOString();
    const todoItem: TodoItem = {
      id: uuidv4(),
      title: request.title.trim(),
      description: request.description ?? null,
      status: 'incomplete',
      createdAt: now,
      updatedAt: now
    };

    // Write to DynamoDB
    await putItem(todoItem);

    // Return 201 with created item
    return success(201, serializeTodoItem(todoItem));
  } catch (err) {
    console.error('Error creating todo:', err);
    return error(500, 'Internal server error');
  }
};
