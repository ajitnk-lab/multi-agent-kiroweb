import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { validateId, validateUpdateBody } from '../lib/validator';
import { deserializeUpdateRequest, serializeTodoItem, SerializationError } from '../lib/serializer';
import { getItem, updateItem } from '../lib/dynamodb-client';
import { success, error } from '../lib/response';
import { TodoItem } from '../types/todo';

/**
 * Lambda handler for PUT /todos/{id}
 * Updates specified fields of an existing todo item.
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Extract and validate id from path parameters
    const id = event.pathParameters?.id;
    const idResult = validateId(id);
    if (!idResult.valid) {
      return error(400, idResult.message);
    }

    // Deserialize request body
    let request;
    try {
      request = deserializeUpdateRequest(event.body);
    } catch (err) {
      if (err instanceof SerializationError) {
        return error(400, err.message);
      }
      return error(400, 'Request body must be valid JSON');
    }

    // Validate update body (at least one field required, field constraints)
    const bodyResult = validateUpdateBody(request);
    if (!bodyResult.valid) {
      return error(400, bodyResult.message);
    }

    // Verify item exists
    const existingItem = await getItem(id!);
    if (!existingItem) {
      return error(404, `No todo item found with id: ${id}`);
    }

    // Build update fields
    const updates: Partial<Pick<TodoItem, 'title' | 'description' | 'status' | 'updatedAt'>> = {
      updatedAt: new Date().toISOString()
    };

    if (request.title !== undefined) {
      updates.title = request.title.trim();
    }
    if (request.description !== undefined) {
      updates.description = request.description;
    }
    if (request.status !== undefined) {
      updates.status = request.status;
    }

    // Update in DynamoDB
    const updatedItem = await updateItem(id!, updates);

    // Return 200 with updated item
    return success(200, serializeTodoItem(updatedItem));
  } catch (err) {
    console.error('Error updating todo:', err);
    return error(500, 'Internal server error');
  }
};
