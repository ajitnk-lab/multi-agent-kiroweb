import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { scanItems } from '../lib/dynamodb-client';
import { serializeTodoItem } from '../lib/serializer';
import { success, error } from '../lib/response';

/**
 * Lambda handler for GET /todos
 * Lists all todo items, sorted by createdAt descending, capped at 100.
 */
export const handler = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Scan DynamoDB for all items (max 100, sorted by createdAt desc)
    const items = await scanItems(100);

    // Serialize all items
    const serializedItems = items.map(item => serializeTodoItem(item));

    // Return 200 with array (empty array if none)
    return success(200, serializedItems);
  } catch (err) {
    console.error('Error listing todos:', err);
    return error(500, 'Internal server error');
  }
};
