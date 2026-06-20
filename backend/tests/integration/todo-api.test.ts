import { handler as createHandler } from '../../src/handlers/createTodo';
import { handler as listHandler } from '../../src/handlers/listTodos';
import { handler as updateHandler } from '../../src/handlers/updateTodo';
import { handler as deleteHandler } from '../../src/handlers/deleteTodo';
import { APIGatewayProxyEvent } from 'aws-lambda';

// Mock DynamoDB - in-memory store for integration testing
const mockStore = new Map<string, any>();

jest.mock('../../src/lib/dynamodb-client', () => ({
  putItem: jest.fn(async (item: any) => {
    mockStore.set(item.id, { ...item });
  }),
  getItem: jest.fn(async (id: string) => {
    return mockStore.get(id) || null;
  }),
  deleteItem: jest.fn(async (id: string) => {
    mockStore.delete(id);
  }),
  scanItems: jest.fn(async (maxItems: number = 100) => {
    const items = Array.from(mockStore.values());
    return items
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, maxItems);
  }),
  updateItem: jest.fn(async (id: string, updates: any) => {
    const existing = mockStore.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    mockStore.set(id, updated);
    return updated;
  })
}));

function createEvent(method: string, path: string, body?: object, pathParams?: Record<string, string>): APIGatewayProxyEvent {
  return {
    body: body ? JSON.stringify(body) : null,
    pathParameters: pathParams || null,
    queryStringParameters: null,
    headers: { 'Content-Type': 'application/json' },
    httpMethod: method,
    isBase64Encoded: false,
    path,
    resource: path,
    stageVariables: null,
    requestContext: {} as any,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null
  } as APIGatewayProxyEvent;
}

describe('Integration Tests: Todo API', () => {
  beforeEach(() => {
    mockStore.clear();
  });

  describe('CRUD Lifecycle', () => {
    it('should create, read, update, and delete a todo item', async () => {
      // CREATE
      const createEvt = createEventHelper('POST', '/todos', { title: 'Test Todo', description: 'Test description' });
      const createResult = await createHandler(createEvt);
      expect(createResult.statusCode).toBe(201);
      const created = JSON.parse(createResult.body);
      expect(created.title).toBe('Test Todo');
      expect(created.description).toBe('Test description');
      expect(created.status).toBe('incomplete');

      // LIST
      const listEvt = createEventHelper('GET', '/todos');
      const listResult = await listHandler(listEvt);
      expect(listResult.statusCode).toBe(200);
      const items = JSON.parse(listResult.body);
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(created.id);

      // UPDATE
      const updateEvt = createEventHelper('PUT', `/todos/${created.id}`, { title: 'Updated Todo', status: 'complete' }, { id: created.id });
      const updateResult = await updateHandler(updateEvt);
      expect(updateResult.statusCode).toBe(200);
      const updated = JSON.parse(updateResult.body);
      expect(updated.title).toBe('Updated Todo');
      expect(updated.status).toBe('complete');

      // DELETE
      const deleteEvt = createEventHelper('DELETE', `/todos/${created.id}`, undefined, { id: created.id });
      const deleteResult = await deleteHandler(deleteEvt);
      expect(deleteResult.statusCode).toBe(200);
      expect(JSON.parse(deleteResult.body).id).toBe(created.id);

      // Verify deleted
      const listAfterDelete = await listHandler(createEventHelper('GET', '/todos'));
      expect(JSON.parse(listAfterDelete.body)).toHaveLength(0);
    });
  });

  describe('Error Scenarios', () => {
    it('should return 400 for POST with missing title', async () => {
      const event = createEventHelper('POST', '/todos', { description: 'No title' });
      const result = await createHandler(event);
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe(true);
    });

    it('should return 400 for POST with empty title', async () => {
      const event = createEventHelper('POST', '/todos', { title: '   ' });
      const result = await createHandler(event);
      expect(result.statusCode).toBe(400);
    });

    it('should return 404 for PUT with non-existent id', async () => {
      const event = createEventHelper('PUT', '/todos/a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5', { title: 'Updated' }, { id: 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5' });
      const result = await updateHandler(event);
      expect(result.statusCode).toBe(404);
    });

    it('should return 404 for DELETE with non-existent id', async () => {
      const event = createEventHelper('DELETE', '/todos/a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5', undefined, { id: 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5' });
      const result = await deleteHandler(event);
      expect(result.statusCode).toBe(404);
    });

    it('should return 400 for PUT with malformed id', async () => {
      const event = createEventHelper('PUT', '/todos/invalid-id', { title: 'Test' }, { id: 'invalid-id' });
      const result = await updateHandler(event);
      expect(result.statusCode).toBe(400);
    });

    it('should return 400 for DELETE with malformed id', async () => {
      const event = createEventHelper('DELETE', '/todos/invalid-id', undefined, { id: 'invalid-id' });
      const result = await deleteHandler(event);
      expect(result.statusCode).toBe(400);
    });
  });

  describe('Data Isolation', () => {
    it('should not share data between tests (store starts empty)', async () => {
      const listEvt = createEventHelper('GET', '/todos');
      const result = await listHandler(listEvt);
      expect(JSON.parse(result.body)).toHaveLength(0);
    });
  });
});

// Helper to avoid name conflict with imported function
function createEventHelper(method: string, path: string, body?: object, pathParams?: Record<string, string>): APIGatewayProxyEvent {
  return createEvent(method, path, body, pathParams);
}
