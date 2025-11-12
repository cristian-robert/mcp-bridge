import {
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCError,
  JSONRPCNotification,
  InitializeRequest,
  InitializeResult,
  ErrorCode,
} from './types.js';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger('mcp-protocol');

export class MCPProtocolHandler {
  private initialized = false;
  private requestHandlers = new Map<string, (params: unknown) => Promise<unknown>>();
  private notificationHandlers = new Map<string, (params: unknown) => void>();

  constructor() {
    this.setupDefaultHandlers();
  }

  private setupDefaultHandlers() {
    this.registerRequestHandler('initialize', this.handleInitialize.bind(this));
    this.registerNotificationHandler('initialized', this.handleInitialized.bind(this));
    this.registerNotificationHandler('notifications/cancelled', this.handleCancelled.bind(this));
  }

  registerRequestHandler(method: string, handler: (params: unknown) => Promise<unknown>) {
    this.requestHandlers.set(method, handler);
  }

  registerNotificationHandler(method: string, handler: (params: unknown) => void) {
    this.notificationHandlers.set(method, handler);
  }

  async handleMessage(message: string): Promise<string | null> {
    try {
      const parsed = JSON.parse(message);

      if (this.isRequest(parsed)) {
        return await this.handleRequest(parsed);
      }

      if (this.isNotification(parsed)) {
        this.handleNotification(parsed);
        return null;
      }

      throw new Error('Invalid JSON-RPC message');
    } catch (error) {
      logger.error('Error handling message:', error);
      return JSON.stringify(this.createErrorResponse(null, ErrorCode.PARSE_ERROR, 'Parse error'));
    }
  }

  private isRequest(obj: unknown): obj is JSONRPCRequest {
    const req = obj as JSONRPCRequest;
    return (
      req.jsonrpc === '2.0' &&
      (typeof req.id === 'string' || typeof req.id === 'number') &&
      typeof req.method === 'string'
    );
  }

  private isNotification(obj: unknown): obj is JSONRPCNotification {
    const notif = obj as JSONRPCNotification;
    return (
      notif.jsonrpc === '2.0' &&
      typeof notif.method === 'string' &&
      !('id' in notif)
    );
  }

  private async handleRequest(request: JSONRPCRequest): Promise<string> {
    const { id, method, params } = request;

    logger.debug(`Handling request: ${method}`, { id });

    const handler = this.requestHandlers.get(method);
    if (!handler) {
      return JSON.stringify(
        this.createErrorResponse(id, ErrorCode.METHOD_NOT_FOUND, `Method not found: ${method}`)
      );
    }

    try {
      const result = await handler(params);
      return JSON.stringify(this.createSuccessResponse(id, result));
    } catch (error) {
      logger.error(`Error handling request ${method}:`, error);
      return JSON.stringify(
        this.createErrorResponse(
          id,
          ErrorCode.INTERNAL_ERROR,
          error instanceof Error ? error.message : 'Internal error'
        )
      );
    }
  }

  private handleNotification(notification: JSONRPCNotification): void {
    const { method, params } = notification;

    logger.debug(`Handling notification: ${method}`);

    const handler = this.notificationHandlers.get(method);
    if (handler) {
      handler(params);
    }
  }

  private async handleInitialize(params: unknown): Promise<InitializeResult> {
    const request = params as InitializeRequest;

    logger.info('Initializing MCP bridge server', {
      clientName: request.clientInfo?.name,
      protocolVersion: request.protocolVersion,
    });

    return {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: 'mcp-bridge',
        version: '1.0.0',
      },
    };
  }

  private handleInitialized(): void {
    this.initialized = true;
    logger.info('MCP bridge server initialized');
  }

  private handleCancelled(params: unknown): void {
    logger.debug('Request cancelled', { params });
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private createSuccessResponse(id: string | number, result: unknown): JSONRPCResponse {
    return {
      jsonrpc: '2.0',
      id,
      result,
    };
  }

  private createErrorResponse(
    id: string | number | null,
    code: ErrorCode,
    message: string,
    data?: unknown
  ): JSONRPCResponse {
    const error: JSONRPCError = {
      code,
      message,
      data,
    };

    return {
      jsonrpc: '2.0',
      id: id ?? 0,
      error,
    };
  }

  createNotification(method: string, params?: unknown): string {
    const notification: JSONRPCNotification = {
      jsonrpc: '2.0',
      method,
      params,
    };
    return JSON.stringify(notification);
  }
}
