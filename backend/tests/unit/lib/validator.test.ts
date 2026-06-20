import { validateTitle, validateDescription, validateId, validateUpdateBody } from '../../../src/lib/validator';

describe('validateTitle', () => {
  it('should accept valid titles (1-255 chars)', () => {
    expect(validateTitle('Hello').valid).toBe(true);
    expect(validateTitle('a').valid).toBe(true);
    expect(validateTitle('a'.repeat(255)).valid).toBe(true);
  });
  it('should reject empty/whitespace titles', () => {
    expect(validateTitle('').valid).toBe(false);
    expect(validateTitle('   ').valid).toBe(false);
  });
  it('should reject titles > 255 chars', () => {
    expect(validateTitle('a'.repeat(256)).valid).toBe(false);
  });
  it('should reject non-string values', () => {
    expect(validateTitle(123).valid).toBe(false);
    expect(validateTitle(null).valid).toBe(false);
    expect(validateTitle(undefined).valid).toBe(false);
  });
});

describe('validateDescription', () => {
  it('should accept valid descriptions', () => {
    expect(validateDescription('Hello').valid).toBe(true);
    expect(validateDescription('a'.repeat(1024)).valid).toBe(true);
  });
  it('should accept null/undefined', () => {
    expect(validateDescription(null).valid).toBe(true);
    expect(validateDescription(undefined).valid).toBe(true);
  });
  it('should reject > 1024 chars', () => {
    expect(validateDescription('a'.repeat(1025)).valid).toBe(false);
  });
});

describe('validateId', () => {
  it('should accept valid UUID v4', () => {
    expect(validateId('a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5').valid).toBe(true);
  });
  it('should reject invalid formats', () => {
    expect(validateId('invalid').valid).toBe(false);
    expect(validateId('').valid).toBe(false);
    expect(validateId(123).valid).toBe(false);
  });
});

describe('validateUpdateBody', () => {
  it('should accept body with at least one field', () => {
    expect(validateUpdateBody({ title: 'New' }).valid).toBe(true);
    expect(validateUpdateBody({ status: 'complete' }).valid).toBe(true);
  });
  it('should reject empty body', () => {
    expect(validateUpdateBody({}).valid).toBe(false);
  });
  it('should reject invalid status', () => {
    expect(validateUpdateBody({ status: 'invalid' }).valid).toBe(false);
  });
});
