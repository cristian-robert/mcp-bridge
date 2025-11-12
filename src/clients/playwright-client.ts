import { MCPClient, MCPClientConfig } from './mcp-client.js';

export function createPlaywrightClient(): MCPClient {
  const config: MCPClientConfig = {
    name: 'playwright',
    command: process.env.PLAYWRIGHT_COMMAND || 'npx -y @playwright/mcp',
  };

  return new MCPClient(config);
}
