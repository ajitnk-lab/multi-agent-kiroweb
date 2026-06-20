import { handler } from '../../../src/handlers/listTodos';
import { APIGatewayProxyEvent } from 'aws-lambda';

const mockScanItems = jest.fn();
jest.mock('../../../src/lib/dynamodb-client', () => ({
  scanItems: (...args: any[]) => mockScanItems(...args)
}));

function createEvent(): APIGatewayProxyEvent {
  return { body: null, pathParameters: null, headers: {}, httpMethod: 'GET', isBase64Encoded: false, path: '/todos', resource: '/todos', stageVariables: null, requestContext: {} as any, multiValueHeaders: {}, multiValueQueryStringParameters: null, queryStringParameters: null } as APIGatewayProxyEvent;
}

describe('listTodos handler', () => {
  beforeEach(() => { mockScanItems.mockReset(); });

  it('should return 200 with items', async () => {
    mockScanItems.mockResolvedValue([{ id: '1', title: 'Test', description: null, status: 'incomplete', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' }]);
    const result = await handler(createEvent());
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toHaveLength(1);
  });

  it('should return 200 with empty array when no items', async () => {
    mockScanItems.mockResolvedValue([]);
    const result = await handler(createEvent());
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual([]);
  });

  it('should return 500 on DynamoDB error', async () => {
    mockScanItems.mockRejectedValue(new Error('DynamoDB error'));
    const result = await handler(createEvent());
    expect(result.statusCode).toBe(500);
  });
});
