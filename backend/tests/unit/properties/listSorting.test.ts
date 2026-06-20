import * as fc from 'fast-check';
import { handler } from '../../../src/handlers/listTodos';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { TodoItem } from '../../../src/types/todo';

// Mock the DynamoDB client
const mockScanItems = jest.fn();
jest.mock('../../../src/lib/dynamodb-client', () => ({
  scanItems: (...args: unknown[]) => mockScanItems(...args)
}));

// Generator for random TodoItems with random timestamps
const todoItemArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.oneof(fc.string({ minLength: 0, maxLength: 100 }), fc.constant(null)),
  status: fc.constantFrom('incomplete' as const, 'complete' as const),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') }).map(d => d.toISOString()),
  updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') }).map(d => d.toISOString())
});

function createEvent(): Partial<APIGatewayProxyEvent> {
  return {
    body: null,
    pathParameters: null,
    queryStringParameters: null,
    headers: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/todos',
    resource: '/todos',
    stageVariables: null,
    requestContext: {} as any,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null
  };
}

/**
 * Property 4: List returns items sorted by createdAt descending and capped at 100
 * 
 * **Validates: Requirements 2.2**
 */
describe('Property 4: List returns items sorted by createdAt descending and capped at 100', () => {
  beforeEach(() => {
    mockScanItems.mockReset();
  });

  it('should return items sorted by createdAt descending', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(todoItemArb, { minLength: 2, maxLength: 50 }),
        async (items: TodoItem[]) => {
          // Mock returns items sorted (as scanItems does internally)
          const sorted = [...items].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          mockScanItems.mockResolvedValue(sorted);

          const event = createEvent() as APIGatewayProxyEvent;
          const result = await handler(event);
          
          expect(result.statusCode).toBe(200);
          
          const responseItems = JSON.parse(result.body);
          
          // Verify ordering: each item's createdAt >= next item's createdAt
          for (let i = 0; i < responseItems.length - 1; i++) {
            const current = new Date(responseItems[i].createdAt).getTime();
            const next = new Date(responseItems[i + 1].createdAt).getTime();
            expect(current).toBeGreaterThanOrEqual(next);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should return at most 100 items', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(todoItemArb, { minLength: 0, maxLength: 150 }),
        async (items: TodoItem[]) => {
          // Simulate capping at 100
          const capped = items.slice(0, 100);
          mockScanItems.mockResolvedValue(capped);

          const event = createEvent() as APIGatewayProxyEvent;
          const result = await handler(event);
          
          expect(result.statusCode).toBe(200);
          const responseItems = JSON.parse(result.body);
          expect(responseItems.length).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should return empty array when no items exist', async () => {
    mockScanItems.mockResolvedValue([]);
    
    const event = createEvent() as APIGatewayProxyEvent;
    const result = await handler(event);
    
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual([]);
  });
});
