import { ParallelExecutor } from '../../src/execution/parallel-executor.js';
import { BridgeOperation, BridgeResponse } from '../../src/protocol/types.js';

describe('ParallelExecutor', () => {
  let executor: ParallelExecutor;

  beforeEach(() => {
    executor = new ParallelExecutor({ maxConcurrent: 2 });
  });

  const createMockOperation = (name: string): BridgeOperation => ({
    category: 'code_operations',
    operation: name,
    params: {},
  });

  const createMockResponse = (operation: string, success: boolean = true): BridgeResponse => ({
    success,
    data: { operation },
    metadata: {
      serverName: 'serena',
      operationName: operation,
      durationMs: 100,
      cached: false,
      tokensEstimate: 500,
    },
  });

  describe('executeBatch', () => {
    it('should execute operations in parallel', async () => {
      const operations = [
        createMockOperation('op1'),
        createMockOperation('op2'),
        createMockOperation('op3'),
      ];

      const executionOrder: string[] = [];
      const mockExecutor = jest.fn(async (op: BridgeOperation) => {
        executionOrder.push(op.operation);
        await new Promise(resolve => setTimeout(resolve, 50));
        return createMockResponse(op.operation);
      });

      const result = await executor.executeBatch(operations, mockExecutor);

      expect(result.summary.total).toBe(3);
      expect(result.summary.succeeded).toBe(3);
      expect(result.summary.failed).toBe(0);
      expect(result.results).toHaveLength(3);
      expect(mockExecutor).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed success and failures', async () => {
      const operations = [
        createMockOperation('success1'),
        createMockOperation('fail1'),
        createMockOperation('success2'),
      ];

      const mockExecutor = jest.fn(async (op: BridgeOperation) => {
        if (op.operation.startsWith('fail')) {
          return createMockResponse(op.operation, false);
        }
        return createMockResponse(op.operation, true);
      });

      const result = await executor.executeBatch(operations, mockExecutor);

      expect(result.summary.succeeded).toBe(2);
      expect(result.summary.failed).toBe(1);
    });

    it('should respect concurrency limit', async () => {
      const operations = Array.from({ length: 10 }, (_, i) => createMockOperation(`op${i}`));

      let maxConcurrent = 0;
      let currentConcurrent = 0;

      const mockExecutor = jest.fn(async (op: BridgeOperation) => {
        currentConcurrent++;
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent);

        await new Promise(resolve => setTimeout(resolve, 50));

        currentConcurrent--;
        return createMockResponse(op.operation);
      });

      await executor.executeBatch(operations, mockExecutor);

      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });

    it('should calculate token estimates', async () => {
      const operations = [
        createMockOperation('op1'),
        createMockOperation('op2'),
      ];

      const mockExecutor = jest.fn(async (op: BridgeOperation) => ({
        success: true,
        data: { operation: op.operation },
        metadata: {
          serverName: 'serena' as const,
          operationName: op.operation,
          durationMs: 100,
          cached: false,
          tokensEstimate: 1000,
        },
      }));

      const result = await executor.executeBatch(operations, mockExecutor);

      expect(result.summary.tokensEstimate).toBe(2000);
    });
  });

  describe('getStats', () => {
    it('should return executor statistics', () => {
      const stats = executor.getStats();

      expect(stats.activeOperations).toBe(0);
      expect(stats.queuedOperations).toBe(0);
      expect(stats.maxConcurrent).toBe(2);
    });
  });
});
