import { z } from 'zod';

// JSON-RPC 2.0 Types
export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: unknown;
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: JSONRPCError;
}

export interface JSONRPCError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JSONRPCNotification {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
}

// MCP Protocol Types
export interface InitializeRequest {
  protocolVersion: string;
  capabilities: ClientCapabilities;
  clientInfo: {
    name: string;
    version: string;
  };
}

export interface ClientCapabilities {
  roots?: {
    listChanged?: boolean;
  };
  sampling?: Record<string, unknown>;
}

export interface InitializeResult {
  protocolVersion: string;
  capabilities: ServerCapabilities;
  serverInfo: {
    name: string;
    version: string;
  };
}

export interface ServerCapabilities {
  tools?: Record<string, unknown>;
  prompts?: Record<string, unknown>;
  resources?: Record<string, unknown>;
}

export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface CallToolRequest {
  name: string;
  arguments?: Record<string, unknown>;
}

export interface CallToolResult {
  content: Array<{
    type: string;
    text?: string;
    data?: unknown;
  }>;
  isError?: boolean;
}

// Bridge-specific types
export type ServerName = 'serena' | 'context7' | 'playwright' | 'tavily' | 'shadcn';

export interface BridgeOperation {
  category: 'code_operations' | 'documentation_lookup' | 'browser_testing' | 'web_research' | 'ui_components';
  operation: string;
  params: Record<string, unknown>;
}

export interface BatchOperation {
  operations: BridgeOperation[];
}

export interface BridgeResponse {
  success: boolean;
  data?: unknown;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
  metadata?: {
    serverName: ServerName;
    operationName: string;
    durationMs: number;
    cached: boolean;
    tokensEstimate?: number;
  };
}

export interface BatchResponse {
  results: BridgeResponse[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
    durationMs: number;
    tokensEstimate: number;
  };
}

// Validation schemas using Zod
export const BridgeOperationSchema = z.object({
  category: z.enum(['code_operations', 'documentation_lookup', 'browser_testing', 'web_research', 'ui_components']),
  operation: z.string(),
  params: z.record(z.unknown()),
});

export const BatchOperationSchema = z.object({
  operations: z.array(BridgeOperationSchema),
});

// Error codes
export enum ErrorCode {
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
  SERVER_ERROR = -32000,
  DOWNSTREAM_ERROR = -32001,
  TIMEOUT_ERROR = -32002,
  CACHE_ERROR = -32003,
}

export type OperationCategory = 'code_operations' | 'documentation_lookup' | 'browser_testing' | 'web_research' | 'ui_components';
