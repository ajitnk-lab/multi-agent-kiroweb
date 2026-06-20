import * as fc from 'fast-check';
import { validateDescription } from '../../../src/lib/validator';

describe('Property 3: Description validation enforces length limit', () => {
  it('should accept descriptions up to 1024 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 1024 }),
        (validDescription) => {
          const result = validateDescription(validDescription);
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject descriptions longer than 1024 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1025, maxLength: 2000 }),
        (oversizedDescription) => {
          const result = validateDescription(oversizedDescription);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept null and undefined descriptions', () => {
    expect(validateDescription(null).valid).toBe(true);
    expect(validateDescription(undefined).valid).toBe(true);
  });

  it('should reject non-string non-null values', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.integer(), fc.boolean(), fc.object()),
        (nonString) => {
          const result = validateDescription(nonString);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
