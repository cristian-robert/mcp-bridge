import { MCPClient, MCPClientConfig } from './mcp-client.js';

export function createSerenaClient(): MCPClient {
  const config: MCPClientConfig = {
    name: 'serena',
    command: process.env.SERENA_COMMAND ||
      'uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant',
    initDelay: 1500,
  };

  return new MCPClient(config);
}
