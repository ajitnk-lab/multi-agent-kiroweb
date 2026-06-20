import { handler } from '../../../src/handlers/createTodo';
import { APIGatewayProxyEvent } from 'aws-lambda';

const mockPutItem = jest.fn();
jest.mock('../../../src/lib/dynamodb-client', () => ({
  putItem: (...args: any[]) => mockPutItem(...args)
}));

function createEvent(body: object | null): APIGatewayProxyEvent {
  return { body: body ? JSON.stringify(body) : null, pathParameters: null, headers: {}, httpMethod: 'POST', isBase64Encoded: false, path: '/todos', resource: '/todos', stageVariables: null, requestContext: {} as any, multiValueHeaders: {}, multiValueQueryStringParameters: null, queryStringParameters: null } as APIGatewayProxyEvent;
}

describe('createTodo handler', () => {
  beforeEach(() => { mockPutItem.mockReset(); mockPutItem.mockResolvedValue(undefined); });

  it('should return 201 with created item on valid input', async () => {
    const result = await handler(createEvent({ title: 'Test todo' }));
    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.title).toBe('Test todo');
    expect(body.status).toBe('incomplete');
    expect(mockPutItem).toHaveBeenCalledTimes(1);
  });

  it('should return 400 when title is missing', async () => {
    const result = await handler(createEvent({ description: 'No title' }));
    expect(result.statusCode).toBe(400);
  });

  it('should return 400 when body is invalid JSON', async () => {
    const event = { ...createEvent(null), body: 'not json' } as APIGatewayProxyEvent;
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
  });

  it('should return 500 when DynamoDB fails', async () => {
    mockPutItem.mockRejectedValue(new Error('DynamoDB error'));
    const result = await handler(createEvent({ title: 'Test' }));
    expect(result.statusCode).toBe(500);
  });
});
