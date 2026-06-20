import * as fc from 'fast-check';
import { validateId } from '../../../src/lib/validator';

describe('Property 7: ID format validation rejects malformed identifiers', () => {
  it('should accept valid UUID v4 strings', () => {
    fc.assert(
      fc.property(
        fc.uuid().filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)),
        (validUuid) => {
          const result = validateId(validUuid);
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject non-UUID strings', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)),
        (invalidId) => {
          const result = validateId(invalidId);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject empty and whitespace-only strings', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constant(' ')),
        (whitespace) => {
          const result = validateId(whitespace);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject non-string values', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.integer(), fc.boolean(), fc.constant(null), fc.constant(undefined)),
        (nonString) => {
          const result = validateId(nonString);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
