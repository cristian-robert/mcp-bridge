import { MCPClient, MCPClientConfig } from './mcp-client.js';

export function createShadcnClient(): MCPClient {
  const config: MCPClientConfig = {
    name: 'shadcn',
    command: process.env.SHADCN_COMMAND || 'npx shadcn@latest mcp',
  };

  return new MCPClient(config);
}
