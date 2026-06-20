import * as fc from 'fast-check';
import { validateTitle } from '../../../src/lib/validator';

describe('Property 2: Title validation rejects invalid inputs', () => {
  it('should reject empty strings after trimming', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constant(' ')).filter(s => s.length > 0),
        (whitespaceOnly) => {
          const result = validateTitle(whitespaceOnly);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject strings longer than 255 characters after trimming', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 256, maxLength: 500 }).filter(s => s.trim().length > 255),
        (oversizedTitle) => {
          const result = validateTitle(oversizedTitle);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept strings between 1 and 255 characters after trimming', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length >= 1 && s.trim().length <= 255),
        (validTitle) => {
          const result = validateTitle(validTitle);
          expect(result.valid).toBe(true);
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
          const result = validateTitle(nonString);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
