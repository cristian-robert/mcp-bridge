import { Tool } from '../protocol/types.js';
import { listOperations } from './operation-registry.js';

/**
 * Bridge tool schemas - only 5-6 tools exposed to Claude instead of 57
 * This achieves the 95% token reduction goal
 */

export const BRIDGE_TOOLS: Tool[] = [
  {
    name: 'code_operations',
    description: 'Execute Serena code analysis, editing, memory, and project operations. Supports search, edit, memory, project analysis, and reflection operations.',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          description: `Operation to execute. Available: ${listOperations('code_operations').join(', ')}`,
          enum: listOperations('code_operations'),
        },
        params: {
          type: 'object',
          description: 'Operation-specific parameters as key-value pairs',
        },
      },
      required: ['operation', 'params'],
    },
  },

  {
    name: 'documentation_lookup',
    description: 'Query official library documentation via Context7. Resolve library identifiers and retrieve comprehensive documentation.',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          description: `Operation to execute. Available: ${listOperations('documentation_lookup').join(', ')}`,
          enum: listOperations('documentation_lookup'),
        },
        params: {
          type: 'object',
          description: 'Operation-specific parameters as key-value pairs',
        },
      },
      required: ['operation', 'params'],
    },
  },

  {
    name: 'browser_testing',
    description: 'Automate browser testing workflows with Playwright. Supports navigation, interaction, inspection, control, and assertion operations.',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          description: `Operation to execute. Available: ${listOperations('browser_testing').join(', ')}`,
          enum: listOperations('browser_testing'),
        },
        params: {
          type: 'object',
          description: 'Operation-specific parameters as key-value pairs',
        },
      },
      required: ['operation', 'params'],
    },
  },

  {
    name: 'web_research',
    description: 'Perform web search and content extraction via Tavily. Search, extract, crawl, and map web content.',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          description: `Operation to execute. Available: ${listOperations('web_research').join(', ')}`,
          enum: listOperations('web_research'),
        },
        params: {
          type: 'object',
          description: 'Operation-specific parameters as key-value pairs',
        },
      },
      required: ['operation', 'params'],
    },
  },

  {
    name: 'ui_components',
    description: 'Manage shadcn/ui components and registries. List, search, view component details, get examples, and generate add commands for UI components.',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          description: `Operation to execute. Available: ${listOperations('ui_components').join(', ')}`,
          enum: listOperations('ui_components'),
        },
        params: {
          type: 'object',
          description: 'Operation-specific parameters as key-value pairs',
        },
      },
      required: ['operation', 'params'],
    },
  },

  {
    name: 'batch_operations',
    description: 'Execute multiple operations in parallel across different servers for maximum efficiency. Automatically handles parallel execution and result aggregation.',
    inputSchema: {
      type: 'object',
      properties: {
        operations: {
          type: 'array',
          description: 'Array of operations to execute in parallel',
          items: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                enum: ['code_operations', 'documentation_lookup', 'browser_testing', 'web_research', 'ui_components'],
                description: 'Operation category',
              },
              operation: {
                type: 'string',
                description: 'Operation name within the category',
              },
              params: {
                type: 'object',
                description: 'Operation-specific parameters',
              },
            },
            required: ['category', 'operation', 'params'],
          },
        },
      },
      required: ['operations'],
    },
  },
];

/**
 * Get tool schema by name
 */
export function getToolSchema(name: string): Tool | undefined {
  return BRIDGE_TOOLS.find(tool => tool.name === name);
}

/**
 * Get all tool names
 */
export function getToolNames(): string[] {
  return BRIDGE_TOOLS.map(tool => tool.name);
}

/**
 * Calculate estimated token count for tool schemas
 */
export function estimateSchemaTokens(): number {
  const schemaText = JSON.stringify(BRIDGE_TOOLS);
  return Math.ceil(schemaText.length / 4);
}
