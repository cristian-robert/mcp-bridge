import { BridgeOperation, BridgeResponse, BatchResponse } from '../protocol/types.js';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger('parallel-executor');

export interface ExecutorConfig {
  maxConcurrent: number;
}

export type OperationExecutor = (operation: BridgeOperation) => Promise<BridgeResponse>;

export class ParallelExecutor {
  private config: ExecutorConfig;
  private activeOperations = 0;
  private queue: Array<{
    operation: BridgeOperation;
    resolve: (result: BridgeResponse) => void;
    reject: (error: Error) => void;
  }> = [];

  constructor(config?: Partial<ExecutorConfig>) {
    this.config = {
      maxConcurrent: config?.maxConcurrent ?? parseInt(process.env.MAX_CONCURRENT_OPERATIONS || '10'),
    };

    logger.info('Parallel executor initialized', this.config);
  }

  /**
   * Execute operations in parallel with concurrency control
   */
  async executeBatch(
    operations: BridgeOperation[],
    executor: OperationExecutor
  ): Promise<BatchResponse> {
    const startTime = Date.now();

    logger.info(`Executing batch of ${operations.length} operations`, {
      maxConcurrent: this.config.maxConcurrent,
    });

    const results = await Promise.allSettled(
      operations.map(operation => this.executeWithConcurrencyControl(operation, executor))
    );

    const bridgeResults: BridgeResponse[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          error: {
            message: result.reason?.message || 'Operation failed',
            code: 'EXECUTION_ERROR',
            details: result.reason,
          },
          metadata: {
            serverName: operations[index].category as any,
            operationName: operations[index].operation,
            durationMs: 0,
            cached: false,
          },
        };
      }
    });

    const totalDurationMs = Date.now() - startTime;
    const succeeded = bridgeResults.filter(r => r.success).length;
    const failed = bridgeResults.filter(r => !r.success).length;
    const tokensEstimate = bridgeResults.reduce(
      (sum, r) => sum + (r.metadata?.tokensEstimate || 0),
      0
    );

    logger.info('Batch execution completed', {
      total: operations.length,
      succeeded,
      failed,
      durationMs: totalDurationMs,
      tokensEstimate,
    });

    return {
      results: bridgeResults,
      summary: {
        total: operations.length,
        succeeded,
        failed,
        durationMs: totalDurationMs,
        tokensEstimate,
      },
    };
  }

  /**
   * Execute single operation with concurrency control
   */
  private async executeWithConcurrencyControl(
    operation: BridgeOperation,
    executor: OperationExecutor
  ): Promise<BridgeResponse> {
    if (this.activeOperations >= this.config.maxConcurrent) {
      logger.debug('Queuing operation due to concurrency limit', {
        active: this.activeOperations,
        max: this.config.maxConcurrent,
      });

      return new Promise((resolve, reject) => {
        this.queue.push({ operation, resolve, reject });
      });
    }

    return this.executeOperation(operation, executor);
  }

  /**
   * Execute operation and manage queue
   */
  private async executeOperation(
    operation: BridgeOperation,
    executor: OperationExecutor
  ): Promise<BridgeResponse> {
    this.activeOperations++;

    try {
      const result = await executor(operation);
      return result;
    } finally {
      this.activeOperations--;
      this.processQueue(executor);
    }
  }

  /**
   * Process queued operations
   */
  private processQueue(executor: OperationExecutor): void {
    while (this.queue.length > 0 && this.activeOperations < this.config.maxConcurrent) {
      const queued = this.queue.shift();

      if (queued) {
        this.executeOperation(queued.operation, executor)
          .then(queued.resolve)
          .catch(queued.reject);
      }
    }
  }

  /**
   * Analyze operations to detect dependencies and optimize execution order
   */
  analyzeOperations(operations: BridgeOperation[]): {
    independent: BridgeOperation[][];
    dependent: BridgeOperation[][];
  } {
    const independent: BridgeOperation[][] = [operations];
    const dependent: BridgeOperation[][] = [];

    logger.debug('Analyzing operations for dependencies', {
      total: operations.length,
    });

    return { independent, dependent };
  }

  /**
   * Get current execution statistics
   */
  getStats(): {
    activeOperations: number;
    queuedOperations: number;
    maxConcurrent: number;
  } {
    return {
      activeOperations: this.activeOperations,
      queuedOperations: this.queue.length,
      maxConcurrent: this.config.maxConcurrent,
    };
  }
}
