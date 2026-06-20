import { success, error } from '../../../src/lib/response';

describe('response builder', () => {
  describe('success', () => {
    it('should return correct status code and JSON body', () => {
      const result = success(200, { data: 'test' });
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ data: 'test' });
    });
    it('should include CORS headers', () => {
      const result = success(200, {});
      expect(result.headers?.['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers?.['Access-Control-Allow-Methods']).toContain('GET');
      expect(result.headers?.['Content-Type']).toBe('application/json');
    });
  });

  describe('error', () => {
    it('should return error format with correct status', () => {
      const result = error(400, 'Bad request');
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe(true);
      expect(body.message).toBe('Bad request');
    });
    it('should include CORS headers', () => {
      const result = error(500, 'Server error');
      expect(result.headers?.['Access-Control-Allow-Origin']).toBe('*');
    });
  });
});
