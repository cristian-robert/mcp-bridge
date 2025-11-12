/**
 * MCP Bridge Usage Examples
 *
 * These examples demonstrate how to use the bridge tools effectively.
 */

// Example 1: Code Search with Serena
const codeSearch = {
  name: 'code_operations',
  arguments: {
    operation: 'findSymbol',
    params: {
      name_path: 'AuthService',
      include_body: true,
    },
  },
};

// Example 2: Documentation Lookup with Context7
const docLookup = {
  name: 'documentation_lookup',
  arguments: {
    operation: 'getLibraryDocs',
    params: {
      library_id: 'react',
      query: 'useState hook usage',
    },
  },
};

// Example 3: Browser Testing with Playwright
const browserTest = {
  name: 'browser_testing',
  arguments: {
    operation: 'navigate',
    params: {
      url: 'https://example.com',
      wait_until: 'networkidle',
    },
  },
};

// Example 4: Web Research with Tavily
const webResearch = {
  name: 'web_research',
  arguments: {
    operation: 'search',
    params: {
      query: 'MCP protocol specification',
      max_results: 5,
      search_depth: 'advanced',
    },
  },
};

// Example 5: Batch Operations (Most Efficient)
const batchOperations = {
  name: 'batch_operations',
  arguments: {
    operations: [
      {
        category: 'code_operations',
        operation: 'findSymbol',
        params: { name_path: 'User' },
      },
      {
        category: 'code_operations',
        operation: 'findSymbol',
        params: { name_path: 'AuthService' },
      },
      {
        category: 'documentation_lookup',
        operation: 'getLibraryDocs',
        params: { library_id: 'react', query: 'hooks' },
      },
      {
        category: 'web_research',
        operation: 'search',
        params: { query: 'React best practices 2024' },
      },
    ],
  },
};

// Example 6: Memory Management with Serena
const memoryWrite = {
  name: 'code_operations',
  arguments: {
    operation: 'writeMemory',
    params: {
      memory_file_name: 'session_context',
      content: JSON.stringify({
        task: 'Implement authentication',
        progress: 'Analyzing existing code',
        findings: ['JWT tokens used', 'No refresh token logic'],
      }),
    },
  },
};

const memoryRead = {
  name: 'code_operations',
  arguments: {
    operation: 'readMemory',
    params: {
      memory_file_name: 'session_context',
    },
  },
};

// Example 7: File Operations with Serena
const fileEdit = {
  name: 'code_operations',
  arguments: {
    operation: 'editFile',
    params: {
      file_path: './src/auth/service.ts',
      edits: [
        {
          old_text: 'const TOKEN_EXPIRY = 3600;',
          new_text: 'const TOKEN_EXPIRY = 7200;',
        },
      ],
    },
  },
};

// Example 8: Project Analysis with Serena
const projectAnalysis = {
  name: 'code_operations',
  arguments: {
    operation: 'analyzeProject',
    params: {
      focus: ['security', 'performance', 'architecture'],
    },
  },
};

// Example 9: Complex Browser Testing Workflow
const browserWorkflow = {
  name: 'batch_operations',
  arguments: {
    operations: [
      {
        category: 'browser_testing',
        operation: 'navigate',
        params: { url: 'https://example.com/login' },
      },
      {
        category: 'browser_testing',
        operation: 'fill',
        params: { selector: '#username', value: 'testuser' },
      },
      {
        category: 'browser_testing',
        operation: 'fill',
        params: { selector: '#password', value: 'testpass' },
      },
      {
        category: 'browser_testing',
        operation: 'click',
        params: { selector: 'button[type="submit"]' },
      },
      {
        category: 'browser_testing',
        operation: 'waitForSelector',
        params: { selector: '.dashboard' },
      },
      {
        category: 'browser_testing',
        operation: 'screenshot',
        params: { path: './test-results/dashboard.png' },
      },
    ],
  },
};

// Example 10: Research + Code Analysis Workflow
const researchAndAnalyze = {
  name: 'batch_operations',
  arguments: {
    operations: [
      {
        category: 'web_research',
        operation: 'search',
        params: { query: 'React Server Components best practices' },
      },
      {
        category: 'documentation_lookup',
        operation: 'getLibraryDocs',
        params: { library_id: 'react', query: 'Server Components' },
      },
      {
        category: 'code_operations',
        operation: 'searchInFiles',
        params: { query: 'use server', file_pattern: '*.tsx' },
      },
      {
        category: 'code_operations',
        operation: 'getProjectStructure',
        params: { max_depth: 3 },
      },
    ],
  },
};

// Example 11: Error Handling Pattern
async function handleOperation(bridgeServer: any, operation: any) {
  try {
    const result = await bridgeServer.handleToolCall(operation);

    if (result.isError) {
      console.error('Operation failed:', result.content[0].text);
      return null;
    }

    const response = JSON.parse(result.content[0].text);

    if (!response.success) {
      console.error('Bridge error:', response.error);
      return null;
    }

    console.log('Success:', response.data);
    console.log('Metadata:', response.metadata);

    return response.data;
  } catch (error) {
    console.error('Unexpected error:', error);
    return null;
  }
}

// Example 12: Optimizing Token Usage
// Instead of multiple sequential calls:
const inefficient = async (bridge: any) => {
  await bridge.handleToolCall({
    name: 'code_operations',
    arguments: { operation: 'findSymbol', params: { name_path: 'User' } },
  });
  await bridge.handleToolCall({
    name: 'code_operations',
    arguments: { operation: 'findSymbol', params: { name_path: 'Post' } },
  });
  await bridge.handleToolCall({
    name: 'code_operations',
    arguments: { operation: 'findSymbol', params: { name_path: 'Comment' } },
  });
};

// Use batch operations for better efficiency:
const efficient = async (bridge: any) => {
  await bridge.handleToolCall({
    name: 'batch_operations',
    arguments: {
      operations: [
        { category: 'code_operations', operation: 'findSymbol', params: { name_path: 'User' } },
        { category: 'code_operations', operation: 'findSymbol', params: { name_path: 'Post' } },
        { category: 'code_operations', operation: 'findSymbol', params: { name_path: 'Comment' } },
      ],
    },
  });
};

export {
  codeSearch,
  docLookup,
  browserTest,
  webResearch,
  batchOperations,
  memoryWrite,
  memoryRead,
  fileEdit,
  projectAnalysis,
  browserWorkflow,
  researchAndAnalyze,
  handleOperation,
  inefficient,
  efficient,
};
