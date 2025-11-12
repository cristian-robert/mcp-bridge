import { spawn, ChildProcess } from 'child_process';
import {
  JSONRPCRequest,
  JSONRPCResponse,
  CallToolRequest,
  CallToolResult,
  ServerName,
} from '../protocol/types.js';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger('mcp-client');

export interface MCPClientConfig {
  name: ServerName;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  initDelay?: number;
}

export class MCPClient {
  private process: ChildProcess | null = null;
  private requestId = 0;
  private pendingRequests = new Map<number, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }>();
  private initialized = false;
  private buffer = '';

  constructor(private config: MCPClientConfig) {}

  async connect(): Promise<void> {
    logger.info(`Connecting to ${this.config.name} MCP server`);

    const [command, ...args] = this.config.command.split(' ');

    this.process = spawn(command, [...args, ...(this.config.args || [])], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        ...this.config.env,
      },
    });

    if (!this.process.stdout || !this.process.stdin || !this.process.stderr) {
      throw new Error(`Failed to spawn ${this.config.name} process`);
    }

    this.process.stdout.on('data', (data: Buffer) => {
      this.handleStdout(data);
    });

    this.process.stderr.on('data', (data: Buffer) => {
      logger.debug(`${this.config.name} stderr:`, data.toString());
    });

    this.process.on('error', (error: Error) => {
      logger.error(`${this.config.name} process error:`, error);
      this.handleProcessError(error);
    });

    this.process.on('exit', (code: number | null) => {
      logger.info(`${this.config.name} process exited with code ${code}`);
      this.handleProcessExit(code);
    });

    await this.initialize();

    if (this.config.initDelay) {
      logger.debug(`Waiting ${this.config.initDelay}ms for ${this.config.name} to stabilize`);
      await new Promise(resolve => setTimeout(resolve, this.config.initDelay));
    }

    logger.info(`${this.config.name} MCP server connected`);
  }

  private handleStdout(data: Buffer): void {
    this.buffer += data.toString();

    let newlineIndex;
    while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, newlineIndex).trim();
      this.buffer = this.buffer.slice(newlineIndex + 1);

      if (line) {
        try {
          const message = JSON.parse(line);
          this.handleMessage(message);
        } catch (error) {
          logger.error(`Failed to parse message from ${this.config.name}:`, error);
        }
      }
    }
  }

  private handleMessage(message: JSONRPCResponse): void {
    if ('id' in message && typeof message.id === 'number') {
      const pending = this.pendingRequests.get(message.id);

      if (pending) {
        this.pendingRequests.delete(message.id);

        if (message.error) {
          pending.reject(new Error(message.error.message));
        } else {
          pending.resolve(message.result);
        }
      }
    } else if ('method' in message) {
      logger.debug(`Received notification from ${this.config.name}:`, message);
    }
  }

  private async initialize(): Promise<void> {
    const result = await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'mcp-bridge',
        version: '1.0.0',
      },
    });

    logger.debug(`${this.config.name} initialized:`, result);

    await this.sendNotification('initialized', {});

    this.initialized = true;
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<CallToolResult> {
    if (!this.initialized) {
      throw new Error(`${this.config.name} client not initialized`);
    }

    const request: CallToolRequest = {
      name,
      arguments: args,
    };

    logger.debug(`Calling tool ${name} on ${this.config.name}`, { args });

    const result = await this.sendRequest('tools/call', request);
    return result as CallToolResult;
  }

  async listTools(): Promise<unknown> {
    if (!this.initialized) {
      throw new Error(`${this.config.name} client not initialized`);
    }

    return await this.sendRequest('tools/list', {});
  }

  private async sendRequest(method: string, params: unknown): Promise<unknown> {
    if (!this.process?.stdin) {
      throw new Error(`${this.config.name} process not running`);
    }

    const id = ++this.requestId;
    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      const message = JSON.stringify(request) + '\n';
      this.process!.stdin!.write(message);

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request ${id} to ${this.config.name} timed out`));
        }
      }, 30000);
    });
  }

  private async sendNotification(method: string, params: unknown): Promise<void> {
    if (!this.process?.stdin) {
      throw new Error(`${this.config.name} process not running`);
    }

    const notification = {
      jsonrpc: '2.0',
      method,
      params,
    };

    const message = JSON.stringify(notification) + '\n';
    this.process.stdin.write(message);
  }

  private handleProcessError(error: Error): void {
    for (const [id, pending] of this.pendingRequests.entries()) {
      pending.reject(error);
      this.pendingRequests.delete(id);
    }
  }

  private handleProcessExit(code: number | null): void {
    const error = new Error(`${this.config.name} process exited with code ${code}`);
    for (const [id, pending] of this.pendingRequests.entries()) {
      pending.reject(error);
      this.pendingRequests.delete(id);
    }
    this.initialized = false;
  }

  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
      this.initialized = false;
      logger.info(`${this.config.name} MCP server disconnected`);
    }
  }

  isConnected(): boolean {
    return this.initialized && this.process !== null;
  }

  getName(): ServerName {
    return this.config.name;
  }
}
