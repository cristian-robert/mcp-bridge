import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { ServerName } from '../protocol/types.js';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger('metrics');

export interface OperationMetric {
  server: ServerName;
  operation: string;
  durationMs: number;
  tokensEstimate: number;
  cached: boolean;
  success: boolean;
  timestamp: number;
}

export interface MetricsSummary {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  totalDurationMs: number;
  averageDurationMs: number;
  totalTokens: number;
  averageTokens: number;
  cacheHitRate: number;
  byServer: Record<ServerName, {
    operations: number;
    tokens: number;
    averageDuration: number;
    successRate: number;
  }>;
  byOperation: Record<string, {
    calls: number;
    tokens: number;
    averageDuration: number;
    successRate: number;
  }>;
}

export class MetricsCollector {
  private metrics: OperationMetric[] = [];
  private enabled: boolean;
  private outputDir: string;

  constructor() {
    this.enabled = process.env.METRICS_ENABLED !== 'false';
    this.outputDir = process.env.METRICS_OUTPUT_DIR || './metrics';

    logger.info('Metrics collector initialized', {
      enabled: this.enabled,
      outputDir: this.outputDir,
    });
  }

  /**
   * Record operation metric
   */
  recordOperation(metric: OperationMetric): void {
    if (!this.enabled) {
      return;
    }

    this.metrics.push(metric);

    logger.debug('Metric recorded', {
      server: metric.server,
      operation: metric.operation,
      durationMs: metric.durationMs,
      tokensEstimate: metric.tokensEstimate,
      cached: metric.cached,
      success: metric.success,
    });
  }

  /**
   * Get metrics summary
   */
  getSummary(): MetricsSummary {
    const totalOperations = this.metrics.length;
    const successfulOperations = this.metrics.filter(m => m.success).length;
    const failedOperations = totalOperations - successfulOperations;

    const totalDurationMs = this.metrics.reduce((sum, m) => sum + m.durationMs, 0);
    const averageDurationMs = totalOperations > 0 ? totalDurationMs / totalOperations : 0;

    const totalTokens = this.metrics.reduce((sum, m) => sum + m.tokensEstimate, 0);
    const averageTokens = totalOperations > 0 ? totalTokens / totalOperations : 0;

    const cachedOperations = this.metrics.filter(m => m.cached).length;
    const cacheHitRate = totalOperations > 0 ? cachedOperations / totalOperations : 0;

    const byServer = this.aggregateByServer();
    const byOperation = this.aggregateByOperation();

    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      totalDurationMs,
      averageDurationMs,
      totalTokens,
      averageTokens,
      cacheHitRate,
      byServer,
      byOperation,
    };
  }

  /**
   * Aggregate metrics by server
   */
  private aggregateByServer(): MetricsSummary['byServer'] {
    const result: MetricsSummary['byServer'] = {} as any;

    const servers = [...new Set(this.metrics.map(m => m.server))];

    for (const server of servers) {
      const serverMetrics = this.metrics.filter(m => m.server === server);

      const operations = serverMetrics.length;
      const tokens = serverMetrics.reduce((sum, m) => sum + m.tokensEstimate, 0);
      const totalDuration = serverMetrics.reduce((sum, m) => sum + m.durationMs, 0);
      const successful = serverMetrics.filter(m => m.success).length;

      result[server] = {
        operations,
        tokens,
        averageDuration: operations > 0 ? totalDuration / operations : 0,
        successRate: operations > 0 ? successful / operations : 0,
      };
    }

    return result;
  }

  /**
   * Aggregate metrics by operation
   */
  private aggregateByOperation(): MetricsSummary['byOperation'] {
    const result: Record<string, {
      calls: number;
      tokens: number;
      averageDuration: number;
      successRate: number;
    }> = {};

    const operations = [...new Set(this.metrics.map(m => m.operation))];

    for (const operation of operations) {
      const opMetrics = this.metrics.filter(m => m.operation === operation);

      const calls = opMetrics.length;
      const tokens = opMetrics.reduce((sum, m) => sum + m.tokensEstimate, 0);
      const totalDuration = opMetrics.reduce((sum, m) => sum + m.durationMs, 0);
      const successful = opMetrics.filter(m => m.success).length;

      result[operation] = {
        calls,
        tokens,
        averageDuration: calls > 0 ? totalDuration / calls : 0,
        successRate: calls > 0 ? successful / calls : 0,
      };
    }

    return result;
  }

  /**
   * Export metrics to file
   */
  async exportMetrics(filename?: string): Promise<string> {
    if (!this.enabled) {
      throw new Error('Metrics collection is disabled');
    }

    await mkdir(this.outputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filepath = join(
      this.outputDir,
      filename || `metrics-${timestamp}.json`
    );

    const data = {
      exportedAt: new Date().toISOString(),
      summary: this.getSummary(),
      metrics: this.metrics,
    };

    await writeFile(filepath, JSON.stringify(data, null, 2));

    logger.info('Metrics exported', { filepath, count: this.metrics.length });

    return filepath;
  }

  /**
   * Reset metrics
   */
  reset(): void {
    const count = this.metrics.length;
    this.metrics = [];
    logger.info('Metrics reset', { clearedCount: count });
  }

  /**
   * Get raw metrics
   */
  getMetrics(): OperationMetric[] {
    return [...this.metrics];
  }

  /**
   * Calculate token reduction compared to direct MCP
   */
  calculateTokenReduction(): {
    bridgeTokens: number;
    estimatedDirectTokens: number;
    reductionPercentage: number;
  } {
    const bridgeTokens = this.metrics.reduce((sum, m) => sum + m.tokensEstimate, 0);

    const toolSchemaTokensPerServer: Record<ServerName, number> = {
      serena: 23000,
      context7: 2000,
      playwright: 21000,
      tavily: 4000,
      shadcn: 7000,
    };

    const servers = new Set(this.metrics.map(m => m.server));
    const estimatedDirectTokens = Array.from(servers).reduce(
      (sum, server) => sum + (toolSchemaTokensPerServer[server] || 0),
      bridgeTokens
    );

    const reductionPercentage =
      estimatedDirectTokens > 0
        ? ((estimatedDirectTokens - bridgeTokens) / estimatedDirectTokens) * 100
        : 0;

    return {
      bridgeTokens,
      estimatedDirectTokens,
      reductionPercentage,
    };
  }
}

export const metrics = new MetricsCollector();
