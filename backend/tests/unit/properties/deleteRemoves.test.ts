import * as fc from 'fast-check';
import { handler } from '../../../src/handlers/deleteTodo';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { TodoItem } from '../../../src/types/todo';

// Mock the DynamoDB client
const mockGetItem = jest.fn();
const mockDeleteItem = jest.fn();
jest.mock('../../../src/lib/dynamodb-client', () => ({
  getItem: (...args: unknown[]) => mockGetItem(...args),
  deleteItem: (...args: unknown[]) => mockDeleteItem(...args)
}));

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Generator for existing TodoItems with valid UUID
const existingItemArb = fc.record({
  id: fc.uuid().filter(id => UUID_V4_REGEX.test(id)),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  description: fc.oneof(fc.string({ minLength: 0, maxLength: 500 }), fc.constant(null)),
  status: fc.constantFrom('incomplete' as const, 'complete' as const),
  createdAt: fc.date().map(d => d.toISOString()),
  updatedAt: fc.date().map(d => d.toISOString())
});

function createEvent(id: string): Partial<APIGatewayProxyEvent> {
  return {
    body: null,
    pathParameters: { id },
    queryStringParameters: null,
    headers: {},
    httpMethod: 'DELETE',
    isBase64Encoded: false,
    path: `/todos/${id}`,
    resource: '/todos/{id}',
    stageVariables: null,
    requestContext: {} as any,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null
  };
}

describe('Property 6: Delete removes item from storage', () => {
  beforeEach(() => {
    mockGetItem.mockReset();
    mockDeleteItem.mockReset();
  });

  it('should call deleteItem for any existing todo and return its id', async () => {
    await fc.assert(
      fc.asyncProperty(
        existingItemArb,
        async (item: TodoItem) => {
          mockGetItem.mockResolvedValue(item);
          mockDeleteItem.mockResolvedValue(undefined);

          const event = createEvent(item.id) as APIGatewayProxyEvent;
          const result = await handler(event);
          
          // Should return 200 with deleted id
          expect(result.statusCode).toBe(200);
          const responseBody = JSON.parse(result.body);
          expect(responseBody.id).toBe(item.id);
          
          // deleteItem should have been called with the id
          expect(mockDeleteItem).toHaveBeenCalledWith(item.id);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should return 404 for non-existent items', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid().filter(id => UUID_V4_REGEX.test(id)),
        async (id: string) => {
          mockGetItem.mockResolvedValue(null);

          const event = createEvent(id) as APIGatewayProxyEvent;
          const result = await handler(event);
          
          expect(result.statusCode).toBe(404);
          expect(mockDeleteItem).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 50 }
    );
  });
});
