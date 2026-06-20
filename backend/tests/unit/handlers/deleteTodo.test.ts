import { handler } from '../../../src/handlers/deleteTodo';
import { APIGatewayProxyEvent } from 'aws-lambda';

const mockGetItem = jest.fn();
const mockDeleteItem = jest.fn();
jest.mock('../../../src/lib/dynamodb-client', () => ({
  getItem: (...args: any[]) => mockGetItem(...args),
  deleteItem: (...args: any[]) => mockDeleteItem(...args)
}));

const VALID_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5';
function createEvent(id: string = VALID_ID): APIGatewayProxyEvent {
  return { body: null, pathParameters: { id }, headers: {}, httpMethod: 'DELETE', isBase64Encoded: false, path: `/todos/${id}`, resource: '/todos/{id}', stageVariables: null, requestContext: {} as any, multiValueHeaders: {}, multiValueQueryStringParameters: null, queryStringParameters: null } as APIGatewayProxyEvent;
}

describe('deleteTodo handler', () => {
  beforeEach(() => { mockGetItem.mockReset(); mockDeleteItem.mockReset(); });

  it('should return 200 with deleted id', async () => {
    mockGetItem.mockResolvedValue({ id: VALID_ID, title: 'Test' });
    mockDeleteItem.mockResolvedValue(undefined);
    const result = await handler(createEvent());
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).id).toBe(VALID_ID);
  });

  it('should return 404 when item does not exist', async () => {
    mockGetItem.mockResolvedValue(null);
    const result = await handler(createEvent());
    expect(result.statusCode).toBe(404);
  });

  it('should return 400 for invalid id', async () => {
    const result = await handler(createEvent('invalid-id'));
    expect(result.statusCode).toBe(400);
  });

  it('should return 500 on DynamoDB error', async () => {
    mockGetItem.mockResolvedValue({ id: VALID_ID });
    mockDeleteItem.mockRejectedValue(new Error('DB error'));
    const result = await handler(createEvent());
    expect(result.statusCode).toBe(500);
  });
});
