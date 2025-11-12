import { ErrorHandler } from '../../src/execution/error-handler.js';
import { CallToolResult } from '../../src/protocol/types.js';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler({
      maxAttempts: 3,
      initialDelayMs: 10,
      maxDelayMs: 100,
      backoffMultiplier: 2,
    });
  });

  const createMockResult = (): CallToolResult => ({
    content: [{ type: 'text', text: 'success' }],
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue(createMockResult());

      const result = await errorHandler.executeWithRetry(operation, {
        server: 'serena',
        tool: 'findSymbol',
        operation: 'findSymbol',
      });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retriable errors', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue(createMockResult());

      const result = await errorHandler.executeWithRetry(operation, {
        server: 'serena',
        tool: 'findSymbol',
        operation: 'findSymbol',
      });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max attempts', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('timeout'));

      const result = await errorHandler.executeWithRetry(operation, {
        server: 'serena',
        tool: 'findSymbol',
        operation: 'findSymbol',
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3);
      expect(result.error).toBeDefined();
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retriable errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('invalid request'));

      const result = await errorHandler.executeWithRetry(operation, {
        server: 'serena',
        tool: 'findSymbol',
        operation: 'findSymbol',
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBeLessThanOrEqual(1);
      expect(result.error).toBeDefined();
    });
  });

  describe('createErrorResult', () => {
    it('should create error result with context', () => {
      const error = new Error('test error');
      const context = { server: 'serena', tool: 'findSymbol' };

      const result = errorHandler.createErrorResult(error, context);

      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('test error');
    });
  });

  describe('aggregateErrors', () => {
    it('should aggregate multiple errors', () => {
      const errors = [
        { error: new Error('error 1'), context: { op: 'op1' } },
        { error: new Error('error 2'), context: { op: 'op2' } },
      ];

      const result = errorHandler.aggregateErrors(errors);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Multiple operations failed');
      expect(result.content[0].text).toContain('error 1');
      expect(result.content[0].text).toContain('error 2');
    });
  });
});
