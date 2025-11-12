import { MCPClient, MCPClientConfig } from './mcp-client.js';

export function createTavilyClient(): MCPClient {
  const tavilyApiKey = process.env.TAVILY_API_KEY;

  if (!tavilyApiKey) {
    throw new Error('TAVILY_API_KEY environment variable is required');
  }

  const config: MCPClientConfig = {
    name: 'tavily',
    command: process.env.TAVILY_COMMAND || 'npx -y tavily-mcp@latest',
    env: {
      TAVILY_API_KEY: tavilyApiKey,
    },
  };

  return new MCPClient(config);
}
