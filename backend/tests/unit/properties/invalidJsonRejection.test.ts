import * as fc from 'fast-check';
import { deserializeCreateRequest, deserializeUpdateRequest, SerializationError } from '../../../src/lib/serializer';

describe('Property 9: Invalid JSON rejection', () => {
  it('should reject non-JSON strings in create request deserialization', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => {
          try { JSON.parse(s); return false; } catch { return true; }
        }),
        (invalidJson) => {
          expect(() => deserializeCreateRequest(invalidJson)).toThrow(SerializationError);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject non-JSON strings in update request deserialization', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => {
          try { JSON.parse(s); return false; } catch { return true; }
        }),
        (invalidJson) => {
          expect(() => deserializeUpdateRequest(invalidJson)).toThrow(SerializationError);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject null body', () => {
    expect(() => deserializeCreateRequest(null)).toThrow(SerializationError);
    expect(() => deserializeUpdateRequest(null)).toThrow(SerializationError);
  });

  it('should reject empty string body', () => {
    expect(() => deserializeCreateRequest('')).toThrow(SerializationError);
    expect(() => deserializeUpdateRequest('')).toThrow(SerializationError);
  });

  it('should reject JSON arrays (not objects)', () => {
    expect(() => deserializeCreateRequest('[]')).toThrow(SerializationError);
    expect(() => deserializeUpdateRequest('[]')).toThrow(SerializationError);
  });

  it('should reject JSON primitives (not objects)', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer().map(n => JSON.stringify(n)),
          fc.boolean().map(b => JSON.stringify(b)),
          fc.constant('null')
        ),
        (primitiveJson) => {
          expect(() => deserializeCreateRequest(primitiveJson)).toThrow(SerializationError);
          expect(() => deserializeUpdateRequest(primitiveJson)).toThrow(SerializationError);
        }
      ),
      { numRuns: 100 }
    );
  });
});
