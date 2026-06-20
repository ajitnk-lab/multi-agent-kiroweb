import { serializeTodoItem, deserializeCreateRequest, deserializeUpdateRequest, SerializationError } from '../../../src/lib/serializer';

describe('serializeTodoItem', () => {
  it('should serialize all fields', () => {
    const item = { id: '123', title: 'Test', description: 'Desc', status: 'incomplete' as const, createdAt: '2024-01-01', updatedAt: '2024-01-01' };
    const result = serializeTodoItem(item);
    expect(result.id).toBe('123');
    expect(result.title).toBe('Test');
    expect(result.description).toBe('Desc');
    expect(result.status).toBe('incomplete');
  });
  it('should set null for missing description', () => {
    const item = { id: '123', title: 'Test', description: null, status: 'incomplete' as const, createdAt: '2024-01-01', updatedAt: '2024-01-01' };
    expect(serializeTodoItem(item).description).toBeNull();
  });
});

describe('deserializeCreateRequest', () => {
  it('should parse valid JSON with title', () => {
    const result = deserializeCreateRequest(JSON.stringify({ title: 'Test' }));
    expect(result.title).toBe('Test');
  });
  it('should throw on null body', () => {
    expect(() => deserializeCreateRequest(null)).toThrow(SerializationError);
  });
  it('should throw on invalid JSON', () => {
    expect(() => deserializeCreateRequest('not json')).toThrow(SerializationError);
  });
});

describe('deserializeUpdateRequest', () => {
  it('should parse valid fields', () => {
    const result = deserializeUpdateRequest(JSON.stringify({ title: 'New', status: 'complete' }));
    expect(result.title).toBe('New');
    expect(result.status).toBe('complete');
  });
  it('should throw on null body', () => {
    expect(() => deserializeUpdateRequest(null)).toThrow(SerializationError);
  });
});
