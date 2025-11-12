#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { config } from 'dotenv';
import { BridgeServer } from './bridge-server.js';
import { logger, createChildLogger } from './utils/logger.js';

config();

const mainLogger = createChildLogger('main');

async function main() {
  mainLogger.info('Starting MCP Bridge Server...');

  const bridgeServer = new BridgeServer();

  try {
    await bridgeServer.initialize();
  } catch (error) {
    mainLogger.error('Failed to initialize bridge server:', error);
    process.exit(1);
  }

  const server = new Server(
    {
      name: 'mcp-bridge',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = bridgeServer.getTools();

    return {
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const result = await bridgeServer.handleToolCall(request.params);
    return {
      content: result.content,
      isError: result.isError,
    };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  mainLogger.info('MCP Bridge Server running');
  mainLogger.info('Dashboard:\n' + bridgeServer.getDashboardText());

  process.on('SIGINT', async () => {
    mainLogger.info('Received SIGINT, shutting down...');

    try {
      await bridgeServer.exportMetrics();
      mainLogger.info('Metrics exported');
    } catch (error) {
      mainLogger.error('Error exporting metrics:', error);
    }

    await bridgeServer.shutdown();
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    mainLogger.info('Received SIGTERM, shutting down...');

    try {
      await bridgeServer.exportMetrics();
    } catch (error) {
      mainLogger.error('Error exporting metrics:', error);
    }

    await bridgeServer.shutdown();
    await server.close();
    process.exit(0);
  });

  setInterval(() => {
    if (bridgeServer.isReady()) {
      const dashboardText = bridgeServer.getDashboardText();
      logger.debug('Dashboard update:\n' + dashboardText);
    }
  }, 60000);
}

main().catch((error) => {
  mainLogger.error('Fatal error:', error);
  process.exit(1);
});
