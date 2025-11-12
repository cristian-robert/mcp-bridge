import { MCPClient } from './clients/mcp-client.js';
import { createSerenaClient } from './clients/serena-client.js';
import { createContext7Client } from './clients/context7-client.js';
import { createPlaywrightClient } from './clients/playwright-client.js';
import { createTavilyClient } from './clients/tavily-client.js';
import { createShadcnClient } from './clients/shadcn-client.js';
import { ResponseCache } from './cache/response-cache.js';
import { ErrorHandler } from './execution/error-handler.js';
import { ParallelExecutor } from './execution/parallel-executor.js';
import { metrics, MetricsCollector } from './monitoring/metrics.js';
import { Dashboard } from './monitoring/dashboard.js';
import { getOperationMapping, isValidOperation } from './registry/operation-registry.js';
import { BRIDGE_TOOLS } from './registry/tool-schemas.js';
import { ResponseFormatter } from './utils/response-formatter.js';
import { createChildLogger } from './utils/logger.js';
import {
  BridgeOperation,
  BridgeResponse,
  BatchResponse,
  CallToolRequest,
  CallToolResult,
  ServerName,
  OperationCategory,
  BridgeOperationSchema,
  BatchOperationSchema,
} from './protocol/types.js';

const logger = createChildLogger('bridge-server');

export class BridgeServer {
  private clients = new Map<ServerName, MCPClient>();
  private cache: ResponseCache;
  private errorHandler: ErrorHandler;
  private executor: ParallelExecutor;
  private metricsCollector: MetricsCollector;
  private dashboard: Dashboard;
  private initialized = false;

  constructor() {
    this.cache = new ResponseCache();
    this.errorHandler = new ErrorHandler();
    this.executor = new ParallelExecutor();
    this.metricsCollector = metrics;
    this.dashboard = new Dashboard(this.metricsCollector, this.cache, this.executor);

    logger.info('Bridge server created');
  }

  /**
   * Initialize all downstream MCP servers
   */
  async initialize(): Promise<void> {
    logger.info('Initializing bridge server...');

    const enabledServers: Array<{
      name: ServerName;
      factory: () => MCPClient;
      enabled: boolean;
    }> = [
      {
        name: 'serena',
        factory: createSerenaClient,
        enabled: process.env.SERENA_ENABLED !== 'false',
      },
      {
        name: 'context7',
        factory: createContext7Client,
        enabled: process.env.CONTEXT7_ENABLED !== 'false',
      },
      {
        name: 'playwright',
        factory: createPlaywrightClient,
        enabled: process.env.PLAYWRIGHT_ENABLED !== 'false',
      },
      {
        name: 'tavily',
        factory: createTavilyClient,
        enabled: process.env.TAVILY_ENABLED !== 'false' && !!process.env.TAVILY_API_KEY,
      },
      {
        name: 'shadcn',
        factory: createShadcnClient,
        enabled: process.env.SHADCN_ENABLED !== 'false',
      },
    ];

    const initPromises = enabledServers
      .filter(server => server.enabled)
      .map(async server => {
        try {
          const client = server.factory();
          await client.connect();
          this.clients.set(server.name, client);
          logger.info(`${server.name} client initialized`);
        } catch (error) {
          logger.error(`Failed to initialize ${server.name}:`, error);
          throw error;
        }
      });

    await Promise.all(initPromises);

    this.initialized = true;
    logger.info('Bridge server initialized', {
      servers: Array.from(this.clients.keys()),
    });
  }

  /**
   * Get bridge tool schemas (only 4-5 tools instead of 50)
   */
  getTools(): typeof BRIDGE_TOOLS {
    return BRIDGE_TOOLS;
  }

  /**
   * Execute a single bridge operation
   */
  async executeOperation(
    category: OperationCategory,
    operation: string,
    params: Record<string, unknown>
  ): Promise<BridgeResponse> {
    if (!this.initialized) {
      throw new Error('Bridge server not initialized');
    }

    if (!isValidOperation(category, operation)) {
      return {
        success: false,
        error: {
          message: `Invalid operation: ${operation} in category ${category}`,
          code: 'INVALID_OPERATION',
        },
      };
    }

    const mapping = getOperationMapping(category, operation);
    if (!mapping) {
      return {
        success: false,
        error: {
          message: `Operation mapping not found: ${operation}`,
          code: 'MAPPING_ERROR',
        },
      };
    }

    const client = this.clients.get(mapping.server);
    if (!client) {
      return {
        success: false,
        error: {
          message: `Server not available: ${mapping.server}`,
          code: 'SERVER_UNAVAILABLE',
        },
      };
    }

    const cached = mapping.cacheable
      ? this.cache.get(mapping.server, mapping.tool, params)
      : null;

    if (cached) {
      logger.debug(`Cache hit for ${mapping.server}:${mapping.tool}`);

      const metadata = {
        serverName: mapping.server,
        operationName: operation,
        durationMs: 0,
        cached: true,
        tokensEstimate: ResponseFormatter.estimateTokens(cached),
      };

      this.metricsCollector.recordOperation({
        server: mapping.server,
        operation,
        durationMs: 0,
        tokensEstimate: metadata.tokensEstimate,
        cached: true,
        success: true,
        timestamp: Date.now(),
      });

      return ResponseFormatter.formatBridgeResponse(cached, metadata);
    }

    const startTime = Date.now();

    const executionResult = await this.errorHandler.executeWithRetry(
      () => client.callTool(mapping.tool, params),
      {
        server: mapping.server,
        tool: mapping.tool,
        operation,
      }
    );

    const durationMs = Date.now() - startTime;

    if (!executionResult.success || !executionResult.result) {
      const error = executionResult.error || new Error('Unknown error');

      this.metricsCollector.recordOperation({
        server: mapping.server,
        operation,
        durationMs,
        tokensEstimate: 0,
        cached: false,
        success: false,
        timestamp: Date.now(),
      });

      return {
        success: false,
        error: {
          message: error.message,
          code: 'EXECUTION_ERROR',
          details: error.stack,
        },
        metadata: {
          serverName: mapping.server,
          operationName: operation,
          durationMs,
          cached: false,
        },
      };
    }

    const result = executionResult.result;
    const compressed = ResponseFormatter.compressResponse(result);

    if (mapping.cacheable) {
      this.cache.set(mapping.server, mapping.tool, params, compressed);
    }

    const metadata = {
      serverName: mapping.server,
      operationName: operation,
      durationMs,
      cached: false,
      tokensEstimate: ResponseFormatter.estimateTokens(compressed),
    };

    this.metricsCollector.recordOperation({
      server: mapping.server,
      operation,
      durationMs,
      tokensEstimate: metadata.tokensEstimate,
      cached: false,
      success: true,
      timestamp: Date.now(),
    });

    return ResponseFormatter.formatBridgeResponse(compressed, metadata);
  }

  /**
   * Execute batch operations in parallel
   */
  async executeBatch(operations: BridgeOperation[]): Promise<BatchResponse> {
    logger.info(`Executing batch of ${operations.length} operations`);

    return await this.executor.executeBatch(
      operations,
      (op) => this.executeOperation(op.category, op.operation, op.params)
    );
  }

  /**
   * Handle tool call request from MCP client
   */
  async handleToolCall(request: CallToolRequest): Promise<CallToolResult> {
    const { name, arguments: args = {} } = request;

    logger.info(`Tool call: ${name}`, { args });

    try {
      if (name === 'batch_operations') {
        const validation = BatchOperationSchema.safeParse(args);

        if (!validation.success) {
          return {
            content: [
              {
                type: 'text',
                text: `Invalid batch operation parameters: ${validation.error.message}`,
              },
            ],
            isError: true,
          };
        }

        const batchResponse = await this.executeBatch(validation.data.operations);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(batchResponse, null, 2),
            },
          ],
        };
      }

      const validation = BridgeOperationSchema.safeParse({
        category: name,
        operation: args['operation'],
        params: args['params'] || {},
      });

      if (!validation.success) {
        return {
          content: [
            {
              type: 'text',
              text: `Invalid operation parameters: ${validation.error.message}`,
            },
          ],
          isError: true,
        };
      }

      const response = await this.executeOperation(
        name as OperationCategory,
        args['operation'] as string,
        args['params'] as Record<string, unknown>
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2),
          },
        ],
        isError: !response.success,
      };
    } catch (error) {
      logger.error('Error handling tool call:', error);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: {
                message: error instanceof Error ? error.message : 'Unknown error',
                code: 'INTERNAL_ERROR',
              },
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Get dashboard data
   */
  getDashboard(): ReturnType<Dashboard['getData']> {
    return this.dashboard.getData();
  }

  /**
   * Get formatted dashboard text
   */
  getDashboardText(): string {
    return this.dashboard.formatAsText();
  }

  /**
   * Export metrics
   */
  async exportMetrics(filename?: string): Promise<string> {
    return await this.metricsCollector.exportMetrics(filename);
  }

  /**
   * Clear cache
   */
  clearCache(pattern?: { server?: string; tool?: string }): number {
    return this.cache.invalidate(pattern);
  }

  /**
   * Shutdown bridge server
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down bridge server...');

    const disconnectPromises = Array.from(this.clients.values()).map(client =>
      client.disconnect()
    );

    await Promise.all(disconnectPromises);

    this.initialized = false;
    logger.info('Bridge server shut down');
  }

  /**
   * Check if server is ready
   */
  isReady(): boolean {
    return this.initialized && Array.from(this.clients.values()).every(c => c.isConnected());
  }
}
