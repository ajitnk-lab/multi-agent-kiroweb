import * as fc from 'fast-check';
import { handler } from '../../../src/handlers/createTodo';
import { APIGatewayProxyEvent } from 'aws-lambda';

// Mock the DynamoDB client
jest.mock('../../../src/lib/dynamodb-client', () => ({
  putItem: jest.fn().mockResolvedValue(undefined)
}));

// Mock uuid to return predictable values for testing structure (not actual UUID)
jest.mock('uuid', () => ({
  v4: () => 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5'
}));

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

function createEvent(body: object): Partial<APIGatewayProxyEvent> {
  return {
    body: JSON.stringify(body),
    pathParameters: null,
    queryStringParameters: null,
    headers: {},
    httpMethod: 'POST',
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
 * Property 1: Create handler produces well-formed TodoItem
 * **Validates: Requirements 1.2**
 */
describe('Property 1: Create handler produces well-formed TodoItem', () => {
  it('should produce a TodoItem with valid UUID, matching title, correct status, and ISO timestamps', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length >= 1 && s.trim().length <= 255),
        fc.option(fc.string({ minLength: 0, maxLength: 1024 }), { nil: undefined }),
        async (title, description) => {
          const body: Record<string, unknown> = { title };
          if (description !== undefined) {
            body.description = description;
          }

          const event = createEvent(body) as APIGatewayProxyEvent;
          const result = await handler(event);
          
          expect(result.statusCode).toBe(201);
          
          const responseBody = JSON.parse(result.body);
          
          // ID is a valid UUID v4
          expect(responseBody.id).toMatch(UUID_V4_REGEX);
          
          // Title matches trimmed input
          expect(responseBody.title).toBe(title.trim());
          
          // Description matches input or is null
          if (description !== undefined) {
            expect(responseBody.description).toBe(description);
          } else {
            expect(responseBody.description).toBeNull();
          }
          
          // Status is "incomplete"
          expect(responseBody.status).toBe('incomplete');
          
          // Timestamps are valid ISO 8601
          expect(responseBody.createdAt).toMatch(ISO_8601_REGEX);
          expect(responseBody.updatedAt).toMatch(ISO_8601_REGEX);
        }
      ),
      { numRuns: 50 } // Reduced for async tests
    );
  });
});
