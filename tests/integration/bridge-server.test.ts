import { BridgeServer } from '../../src/bridge-server.js';

describe('BridgeServer Integration', () => {
  let server: BridgeServer;

  beforeAll(async () => {
    server = new BridgeServer();
  }, 60000);

  afterAll(async () => {
    if (server.isReady()) {
      await server.shutdown();
    }
  });

  describe('initialization', () => {
    it('should provide bridge tools', () => {
      const tools = server.getTools();

      expect(tools).toBeDefined();
      expect(tools.length).toBeGreaterThanOrEqual(4);

      const toolNames = tools.map(t => t.name);
      expect(toolNames).toContain('code_operations');
      expect(toolNames).toContain('documentation_lookup');
      expect(toolNames).toContain('browser_testing');
      expect(toolNames).toContain('web_research');
      expect(toolNames).toContain('batch_operations');
    });

    it('should have minimal token overhead', () => {
      const tools = server.getTools();
      const schemaSize = JSON.stringify(tools).length;
      const estimatedTokens = Math.ceil(schemaSize / 4);

      expect(estimatedTokens).toBeLessThan(2000);
    });
  });

  describe('tool calls', () => {
    it('should handle invalid tool name', async () => {
      const result = await server.handleToolCall({
        name: 'invalid_tool',
        arguments: {},
      });

      expect(result.isError).toBe(true);
    });

    it('should handle invalid operation parameters', async () => {
      const result = await server.handleToolCall({
        name: 'code_operations',
        arguments: {
          operation: 'findSymbol',
        },
      });

      expect(result.isError).toBe(true);
    });
  });

  describe('dashboard', () => {
    it('should provide dashboard data', () => {
      const dashboard = server.getDashboard();

      expect(dashboard).toBeDefined();
      expect(dashboard.metrics).toBeDefined();
      expect(dashboard.cache).toBeDefined();
      expect(dashboard.executor).toBeDefined();
      expect(dashboard.uptime).toBeDefined();
    });

    it('should provide formatted dashboard text', () => {
      const text = server.getDashboardText();

      expect(text).toBeDefined();
      expect(text).toContain('MCP Bridge Dashboard');
      expect(text).toContain('Operations');
      expect(text).toContain('Token Efficiency');
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      const cleared = server.clearCache();
      expect(cleared).toBeGreaterThanOrEqual(0);
    });

    it('should clear cache by server pattern', () => {
      const cleared = server.clearCache({ server: 'serena' });
      expect(cleared).toBeGreaterThanOrEqual(0);
    });
  });
});
