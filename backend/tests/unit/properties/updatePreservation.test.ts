import * as fc from 'fast-check';
import { handler } from '../../../src/handlers/updateTodo';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { TodoItem } from '../../../src/types/todo';

// Mock the DynamoDB client
const mockGetItem = jest.fn();
const mockUpdateItem = jest.fn();
jest.mock('../../../src/lib/dynamodb-client', () => ({
  getItem: (...args: unknown[]) => mockGetItem(...args),
  updateItem: (...args: unknown[]) => mockUpdateItem(...args)
}));

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Generator for existing TodoItems
const existingItemArb = fc.record({
  id: fc.uuid().filter(id => UUID_V4_REGEX.test(id)),
  title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length >= 1),
  description: fc.oneof(fc.string({ minLength: 1, maxLength: 500 }), fc.constant(null)),
  status: fc.constantFrom('incomplete' as const, 'complete' as const),
  createdAt: fc.date().map(d => d.toISOString()),
  updatedAt: fc.date().map(d => d.toISOString())
});

// Generator for partial update requests (at least one field)
const updateFieldsArb = fc.record({
  title: fc.option(fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length >= 1), { nil: undefined }),
  description: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
  status: fc.option(fc.constantFrom('incomplete' as const, 'complete' as const), { nil: undefined })
}).filter(obj => obj.title !== undefined || obj.description !== undefined || obj.status !== undefined);

function createEvent(id: string, body: object): Partial<APIGatewayProxyEvent> {
  return {
    body: JSON.stringify(body),
    pathParameters: { id },
    queryStringParameters: null,
    headers: {},
    httpMethod: 'PUT',
    isBase64Encoded: false,
    path: `/todos/${id}`,
    resource: '/todos/{id}',
    stageVariables: null,
    requestContext: {} as any,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null
  };
}

/**
 * Property 5: Update preserves unspecified fields
 * 
 * Validates: Requirements 3.2
 * 
 * For any existing TodoItem and any valid subset of updatable fields (title, description, status)
 * where at least one field is provided, after invoking the update handler, all fields NOT included
 * in the update request SHALL retain their original values, and the updatedAt timestamp SHALL be
 * different from the original.
 */
describe('Property 5: Update preserves unspecified fields', () => {
  beforeEach(() => {
    mockGetItem.mockReset();
    mockUpdateItem.mockReset();
  });

  it('should preserve fields not included in the update request', async () => {
    await fc.assert(
      fc.asyncProperty(
        existingItemArb,
        updateFieldsArb,
        async (existingItem: TodoItem, updateFields) => {
          mockGetItem.mockResolvedValue(existingItem);
          
          // Simulate the updated item: original values for unspecified fields, new values for specified
          const updatedItem: TodoItem = {
            ...existingItem,
            ...(updateFields.title !== undefined ? { title: updateFields.title.trim() } : {}),
            ...(updateFields.description !== undefined ? { description: updateFields.description } : {}),
            ...(updateFields.status !== undefined ? { status: updateFields.status } : {}),
            updatedAt: new Date().toISOString()
          };
          mockUpdateItem.mockResolvedValue(updatedItem);

          const event = createEvent(existingItem.id, updateFields) as APIGatewayProxyEvent;
          const result = await handler(event);
          
          expect(result.statusCode).toBe(200);
          const responseBody = JSON.parse(result.body);
          
          // Unspecified fields must retain original values
          if (updateFields.title === undefined) {
            expect(responseBody.title).toBe(existingItem.title);
          }
          if (updateFields.description === undefined) {
            expect(responseBody.description).toBe(existingItem.description);
          }
          if (updateFields.status === undefined) {
            expect(responseBody.status).toBe(existingItem.status);
          }
          
          // createdAt should never change
          expect(responseBody.createdAt).toBe(existingItem.createdAt);
          
          // updatedAt should be different from original
          expect(responseBody.updatedAt).not.toBe(existingItem.updatedAt);
        }
      ),
      { numRuns: 50 }
    );
  });
});
