import * as fc from 'fast-check';
import { serializeTodoItem } from '../../../src/lib/serializer';
import { TodoItem } from '../../../src/types/todo';

// Generator for valid TodoItems
const todoItemArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0),
  description: fc.oneof(fc.string({ minLength: 0, maxLength: 1024 }), fc.constant(null)),
  status: fc.constantFrom('incomplete' as const, 'complete' as const),
  createdAt: fc.date().map(d => d.toISOString()),
  updatedAt: fc.date().map(d => d.toISOString())
});

describe('Property 8: TodoItem serialization round-trip', () => {
  it('should produce identical field values after serialize then deserialize', () => {
    fc.assert(
      fc.property(
        todoItemArb,
        (item: TodoItem) => {
          // Serialize to JSON-safe object
          const serialized = serializeTodoItem(item);
          
          // Convert to JSON string and back (simulating network transport)
          const jsonString = JSON.stringify(serialized);
          const deserialized = JSON.parse(jsonString) as TodoItem;
          
          // Verify round-trip equivalence
          expect(deserialized.id).toBe(item.id);
          expect(deserialized.title).toBe(item.title);
          expect(deserialized.description).toBe(item.description ?? null);
          expect(deserialized.status).toBe(item.status);
          expect(deserialized.createdAt).toBe(item.createdAt);
          expect(deserialized.updatedAt).toBe(item.updatedAt);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should always produce null for undefined description', () => {
    fc.assert(
      fc.property(
        todoItemArb.map(item => ({ ...item, description: null })),
        (item: TodoItem) => {
          const serialized = serializeTodoItem(item);
          expect(serialized.description).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
