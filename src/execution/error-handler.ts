import { CallToolResult } from '../protocol/types.js';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger('error-handler');

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface ExecutionResult {
  success: boolean;
  result?: CallToolResult;
  error?: Error;
  attempts: number;
  totalDurationMs: number;
}

export class ErrorHandler {
  private config: RetryConfig;

  constructor(config?: Partial<RetryConfig>) {
    this.config = {
      maxAttempts: config?.maxAttempts ?? parseInt(process.env.RETRY_MAX_ATTEMPTS || '3'),
      initialDelayMs: config?.initialDelayMs ?? parseInt(process.env.RETRY_INITIAL_DELAY_MS || '1000'),
      maxDelayMs: config?.maxDelayMs ?? parseInt(process.env.RETRY_MAX_DELAY_MS || '10000'),
      backoffMultiplier: config?.backoffMultiplier ?? 2,
    };

    logger.info('Error handler initialized', this.config);
  }

  /**
   * Execute operation with retry logic and exponential backoff
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: {
      server: string;
      tool: string;
      operation: string;
    }
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        logger.debug(`Attempt ${attempt}/${this.config.maxAttempts}`, context);

        const result = await operation();

        const totalDurationMs = Date.now() - startTime;

        if (attempt > 1) {
          logger.info(`Operation succeeded after ${attempt} attempts`, {
            ...context,
            totalDurationMs,
          });
        }

        return {
          success: true,
          result: result as CallToolResult,
          attempts: attempt,
          totalDurationMs,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        logger.warn(`Attempt ${attempt} failed`, {
          ...context,
          error: lastError.message,
        });

        if (attempt < this.config.maxAttempts) {
          const delayMs = this.calculateBackoffDelay(attempt);

          if (this.isRetriable(lastError)) {
            logger.debug(`Retrying after ${delayMs}ms`, context);
            await this.sleep(delayMs);
          } else {
            logger.warn('Error is not retriable, stopping attempts', {
              ...context,
              error: lastError.message,
            });
            break;
          }
        }
      }
    }

    const totalDurationMs = Date.now() - startTime;

    logger.error('Operation failed after all retry attempts', {
      ...context,
      attempts: this.config.maxAttempts,
      totalDurationMs,
      error: lastError?.message,
    });

    return {
      success: false,
      error: lastError,
      attempts: this.config.maxAttempts,
      totalDurationMs,
    };
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private calculateBackoffDelay(attempt: number): number {
    const exponentialDelay = this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, attempt - 1);
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelayMs);
    const jitter = Math.random() * 0.1 * cappedDelay;

    return Math.floor(cappedDelay + jitter);
  }

  /**
   * Determine if error is retriable
   */
  private isRetriable(error: Error): boolean {
    const message = error.message.toLowerCase();

    const nonRetriablePatterns = [
      'invalid',
      'not found',
      'unauthorized',
      'forbidden',
      'bad request',
      'validation',
      'parse error',
    ];

    const retriablePatterns = [
      'timeout',
      'econnrefused',
      'econnreset',
      'etimedout',
      'network',
      'temporary',
    ];

    for (const pattern of nonRetriablePatterns) {
      if (message.includes(pattern)) {
        return false;
      }
    }

    for (const pattern of retriablePatterns) {
      if (message.includes(pattern)) {
        return true;
      }
    }

    return true;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create error result with metadata
   */
  createErrorResult(error: Error, context: Record<string, unknown>): CallToolResult {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error.message,
            context,
            stack: error.stack,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }

  /**
   * Wrap multiple errors into a single result
   */
  aggregateErrors(errors: Array<{ error: Error; context: Record<string, unknown> }>): CallToolResult {
    const errorSummary = errors.map(({ error, context }) => ({
      message: error.message,
      context,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            message: 'Multiple operations failed',
            errors: errorSummary,
            count: errors.length,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}
