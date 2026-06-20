import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { validateId } from '../lib/validator';
import { getItem, deleteItem } from '../lib/dynamodb-client';
import { success, error } from '../lib/response';

/**
 * Lambda handler for DELETE /todos/{id}
 * Deletes an existing todo item by id.
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Extract and validate id from path parameters
    const id = event.pathParameters?.id;
    const idResult = validateId(id);
    if (!idResult.valid) {
      return error(400, idResult.message);
    }

    // Verify item exists
    const existingItem = await getItem(id!);
    if (!existingItem) {
      return error(404, `No todo item found with id: ${id}`);
    }

    // Delete from DynamoDB
    await deleteItem(id!);

    // Return 200 with deleted id
    return success(200, { id });
  } catch (err) {
    console.error('Error deleting todo:', err);
    return error(500, 'Internal server error');
  }
};
