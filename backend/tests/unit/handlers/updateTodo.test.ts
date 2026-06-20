import { handler } from '../../../src/handlers/updateTodo';
import { APIGatewayProxyEvent } from 'aws-lambda';

const mockGetItem = jest.fn();
const mockUpdateItem = jest.fn();
jest.mock('../../../src/lib/dynamodb-client', () => ({
  getItem: (...args: any[]) => mockGetItem(...args),
  updateItem: (...args: any[]) => mockUpdateItem(...args)
}));

const VALID_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5';
function createEvent(body: object | null, id: string = VALID_ID): APIGatewayProxyEvent {
  return { body: body ? JSON.stringify(body) : null, pathParameters: { id }, headers: {}, httpMethod: 'PUT', isBase64Encoded: false, path: `/todos/${id}`, resource: '/todos/{id}', stageVariables: null, requestContext: {} as any, multiValueHeaders: {}, multiValueQueryStringParameters: null, queryStringParameters: null } as APIGatewayProxyEvent;
}

const existingItem = { id: VALID_ID, title: 'Original', description: null, status: 'incomplete' as const, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' };

describe('updateTodo handler', () => {
  beforeEach(() => { mockGetItem.mockReset(); mockUpdateItem.mockReset(); });

  it('should return 200 with updated item', async () => {
    mockGetItem.mockResolvedValue(existingItem);
    mockUpdateItem.mockResolvedValue({ ...existingItem, title: 'Updated', updatedAt: '2024-01-02T00:00:00.000Z' });
    const result = await handler(createEvent({ title: 'Updated' }));
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).title).toBe('Updated');
  });

  it('should return 404 when item does not exist', async () => {
    mockGetItem.mockResolvedValue(null);
    const result = await handler(createEvent({ title: 'Test' }));
    expect(result.statusCode).toBe(404);
  });

  it('should return 400 when no updatable fields provided', async () => {
    const result = await handler(createEvent({}));
    expect(result.statusCode).toBe(400);
  });

  it('should return 400 for invalid id format', async () => {
    const result = await handler(createEvent({ title: 'Test' }, 'invalid-id'));
    expect(result.statusCode).toBe(400);
  });
});
