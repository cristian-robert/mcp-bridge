import { MCPClient, MCPClientConfig } from './mcp-client.js';

export function createContext7Client(): MCPClient {
  const config: MCPClientConfig = {
    name: 'context7',
    command: process.env.CONTEXT7_COMMAND || 'npx -y @upstash/context7-mcp',
  };

  return new MCPClient(config);
}
