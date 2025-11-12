import { MetricsCollector } from './metrics.js';
import { ResponseCache } from '../cache/response-cache.js';
import { ParallelExecutor } from '../execution/parallel-executor.js';

export interface DashboardData {
  metrics: {
    summary: ReturnType<MetricsCollector['getSummary']>;
    tokenReduction: ReturnType<MetricsCollector['calculateTokenReduction']>;
  };
  cache: ReturnType<ResponseCache['getStats']>;
  executor: ReturnType<ParallelExecutor['getStats']>;
  uptime: {
    seconds: number;
    formatted: string;
  };
}

export class Dashboard {
  private startTime = Date.now();

  constructor(
    private metrics: MetricsCollector,
    private cache: ResponseCache,
    private executor: ParallelExecutor
  ) {}

  /**
   * Get complete dashboard data
   */
  getData(): DashboardData {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;

    return {
      metrics: {
        summary: this.metrics.getSummary(),
        tokenReduction: this.metrics.calculateTokenReduction(),
      },
      cache: this.cache.getStats(),
      executor: this.executor.getStats(),
      uptime: {
        seconds: uptimeSeconds,
        formatted: `${hours}h ${minutes}m ${seconds}s`,
      },
    };
  }

  /**
   * Format dashboard as text
   */
  formatAsText(): string {
    const data = this.getData();
    const { summary, tokenReduction } = data.metrics;

    const lines = [
      '╔════════════════════════════════════════════════════════════════╗',
      '║                    MCP Bridge Dashboard                        ║',
      '╚════════════════════════════════════════════════════════════════╝',
      '',
      '📊 Operations',
      `   Total: ${summary.totalOperations}`,
      `   Successful: ${summary.successfulOperations} (${(summary.successfulOperations / summary.totalOperations * 100).toFixed(1)}%)`,
      `   Failed: ${summary.failedOperations}`,
      `   Avg Duration: ${summary.averageDurationMs.toFixed(2)}ms`,
      '',
      '🎯 Token Efficiency',
      `   Bridge Tokens: ${tokenReduction.bridgeTokens.toLocaleString()}`,
      `   Direct MCP Est: ${tokenReduction.estimatedDirectTokens.toLocaleString()}`,
      `   Reduction: ${tokenReduction.reductionPercentage.toFixed(1)}%`,
      `   Avg per Op: ${summary.averageTokens.toFixed(0)}`,
      '',
      '💾 Cache',
      `   Size: ${data.cache.size}/${data.cache.maxSize}`,
      `   Hit Rate: ${((data.cache.hitRate || 0) * 100).toFixed(1)}%`,
      `   Enabled: ${data.cache.enabled}`,
      `   TTL: ${data.cache.ttlSeconds}s`,
      '',
      '⚡ Executor',
      `   Active: ${data.executor.activeOperations}`,
      `   Queued: ${data.executor.queuedOperations}`,
      `   Max Concurrent: ${data.executor.maxConcurrent}`,
      '',
      '🖥️  Servers',
    ];

    for (const [server, stats] of Object.entries(summary.byServer)) {
      lines.push(
        `   ${server}:`,
        `     Operations: ${stats.operations}`,
        `     Tokens: ${stats.tokens.toLocaleString()}`,
        `     Avg Duration: ${stats.averageDuration.toFixed(2)}ms`,
        `     Success Rate: ${(stats.successRate * 100).toFixed(1)}%`
      );
    }

    lines.push(
      '',
      '🔧 Top Operations',
    );

    const topOps = Object.entries(summary.byOperation)
      .sort((a, b) => b[1].calls - a[1].calls)
      .slice(0, 5);

    for (const [operation, stats] of topOps) {
      lines.push(
        `   ${operation}: ${stats.calls} calls, ${stats.tokens} tokens`
      );
    }

    lines.push(
      '',
      `⏱️  Uptime: ${data.uptime.formatted}`,
      ''
    );

    return lines.join('\n');
  }

  /**
   * Format dashboard as JSON
   */
  formatAsJSON(): string {
    return JSON.stringify(this.getData(), null, 2);
  }
}
