import { ServerName, OperationCategory } from '../protocol/types.js';

export interface OperationMapping {
  server: ServerName;
  tool: string;
  description: string;
  cacheable: boolean;
}

export interface OperationRegistry {
  code_operations: Record<string, OperationMapping>;
  documentation_lookup: Record<string, OperationMapping>;
  browser_testing: Record<string, OperationMapping>;
  web_research: Record<string, OperationMapping>;
  ui_components: Record<string, OperationMapping>;
}

/**
 * Complete mapping of all 57 downstream MCP tools to bridge operations
 */
export const OPERATION_REGISTRY: OperationRegistry = {
  // Serena MCP - 23 tools for code operations
  code_operations: {
    // Search operations (5 tools)
    findSymbol: {
      server: 'serena',
      tool: 'find_symbol',
      description: 'Find symbols (functions, classes, variables) in codebase',
      cacheable: true,
    },
    findReferencingSymbols: {
      server: 'serena',
      tool: 'find_referencing_symbols',
      description: 'Find all references to a symbol',
      cacheable: true,
    },
    findFiles: {
      server: 'serena',
      tool: 'find_file',
      description: 'Search for files by name or pattern',
      cacheable: true,
    },
    findDirectory: {
      server: 'serena',
      tool: 'find_directory',
      description: 'Search for directories by name or pattern',
      cacheable: true,
    },
    searchInFiles: {
      server: 'serena',
      tool: 'search_for_pattern',
      description: 'Search for text content across files',
      cacheable: true,
    },

    // Edit operations (6 tools)
    editFile: {
      server: 'serena',
      tool: 'replace_lines',
      description: 'Edit file content with semantic understanding',
      cacheable: false,
    },
    writeFile: {
      server: 'serena',
      tool: 'create_text_file',
      description: 'Write content to a file',
      cacheable: false,
    },
    createFile: {
      server: 'serena',
      tool: 'create_text_file',
      description: 'Create a new file',
      cacheable: false,
    },
    deleteFile: {
      server: 'serena',
      tool: 'delete_lines',
      description: 'Delete a file',
      cacheable: false,
    },
    renameFile: {
      server: 'serena',
      tool: 'replace_lines',
      description: 'Rename or move a file',
      cacheable: false,
    },
    moveFile: {
      server: 'serena',
      tool: 'replace_lines',
      description: 'Move a file to a different location',
      cacheable: false,
    },

    // Memory operations (4 tools)
    readMemory: {
      server: 'serena',
      tool: 'read_memory',
      description: 'Read session memory/context',
      cacheable: true,
    },
    writeMemory: {
      server: 'serena',
      tool: 'write_memory',
      description: 'Write to session memory/context',
      cacheable: false,
    },
    deleteMemory: {
      server: 'serena',
      tool: 'delete_memory',
      description: 'Delete session memory/context',
      cacheable: false,
    },
    listMemories: {
      server: 'serena',
      tool: 'list_memories',
      description: 'List all session memories',
      cacheable: false,
    },

    // Project operations (2 tools)
    getProjectStructure: {
      server: 'serena',
      tool: 'list_dir',
      description: 'Get overall project structure',
      cacheable: true,
    },
    analyzeProject: {
      server: 'serena',
      tool: 'get_symbols_overview',
      description: 'Perform deep project analysis',
      cacheable: true,
    },

    // Thinking operations (4 tools)
    thinkAboutTaskAdherence: {
      server: 'serena',
      tool: 'think_about_task_adherence',
      description: 'Reflect on task adherence and progress',
      cacheable: false,
    },
    thinkAboutCollectedInformation: {
      server: 'serena',
      tool: 'think_about_collected_information',
      description: 'Reflect on collected information',
      cacheable: false,
    },
    thinkAboutWhetherYouAreDone: {
      server: 'serena',
      tool: 'think_about_whether_you_are_done',
      description: 'Reflect on task completion status',
      cacheable: false,
    },
    thinkAboutCurrentTask: {
      server: 'serena',
      tool: 'think_about_collected_information',
      description: 'Reflect on current task context',
      cacheable: false,
    },

    // Session operations (2 tools)
    getSessionInfo: {
      server: 'serena',
      tool: 'get_current_config',
      description: 'Get current session information',
      cacheable: false,
    },
    updateSessionInfo: {
      server: 'serena',
      tool: 'switch_modes',
      description: 'Update session information',
      cacheable: false,
    },
  },

  // Context7 MCP - 2 tools for documentation
  documentation_lookup: {
    resolveLibraryId: {
      server: 'context7',
      tool: 'resolve-library-id',
      description: 'Resolve library name to Context7 ID',
      cacheable: true,
    },
    getLibraryDocs: {
      server: 'context7',
      tool: 'get-library-docs',
      description: 'Get official documentation for a library',
      cacheable: true,
    },
  },

  // Playwright MCP - 21 tools for browser testing
  browser_testing: {
    // Navigation (4 tools)
    navigate: {
      server: 'playwright',
      tool: 'browser_navigate',
      description: 'Navigate to a URL',
      cacheable: false,
    },
    goBack: {
      server: 'playwright',
      tool: 'browser_navigate_back',
      description: 'Navigate back in history',
      cacheable: false,
    },
    goForward: {
      server: 'playwright',
      tool: 'browser_go_forward',
      description: 'Navigate forward in history',
      cacheable: false,
    },
    reload: {
      server: 'playwright',
      tool: 'browser_reload',
      description: 'Reload current page',
      cacheable: false,
    },

    // Interaction (7 tools)
    click: {
      server: 'playwright',
      tool: 'browser_click',
      description: 'Click an element',
      cacheable: false,
    },
    fill: {
      server: 'playwright',
      tool: 'browser_fill_form',
      description: 'Fill input field',
      cacheable: false,
    },
    select: {
      server: 'playwright',
      tool: 'browser_select_option',
      description: 'Select dropdown option',
      cacheable: false,
    },
    check: {
      server: 'playwright',
      tool: 'browser_check',
      description: 'Check checkbox',
      cacheable: false,
    },
    uncheck: {
      server: 'playwright',
      tool: 'browser_uncheck',
      description: 'Uncheck checkbox',
      cacheable: false,
    },
    hover: {
      server: 'playwright',
      tool: 'browser_hover',
      description: 'Hover over element',
      cacheable: false,
    },
    press: {
      server: 'playwright',
      tool: 'browser_press_key',
      description: 'Press keyboard key',
      cacheable: false,
    },

    // Inspection (3 tools)
    takeSnapshot: {
      server: 'playwright',
      tool: 'browser_snapshot',
      description: 'Take page snapshot (HTML)',
      cacheable: false,
    },
    getElements: {
      server: 'playwright',
      tool: 'browser_get_elements',
      description: 'Get elements matching selector',
      cacheable: false,
    },
    evaluate: {
      server: 'playwright',
      tool: 'browser_evaluate',
      description: 'Evaluate JavaScript in page context',
      cacheable: false,
    },

    // Control (3 tools)
    setViewportSize: {
      server: 'playwright',
      tool: 'browser_resize',
      description: 'Set browser viewport size',
      cacheable: false,
    },
    close: {
      server: 'playwright',
      tool: 'browser_close',
      description: 'Close browser page',
      cacheable: false,
    },
    newPage: {
      server: 'playwright',
      tool: 'browser_new_page',
      description: 'Open new browser page',
      cacheable: false,
    },

    // Testing (4 tools)
    waitForSelector: {
      server: 'playwright',
      tool: 'browser_wait_for_selector',
      description: 'Wait for element to appear',
      cacheable: false,
    },
    waitForNavigation: {
      server: 'playwright',
      tool: 'browser_wait_for_navigation',
      description: 'Wait for navigation to complete',
      cacheable: false,
    },
    screenshot: {
      server: 'playwright',
      tool: 'browser_take_screenshot',
      description: 'Take page screenshot',
      cacheable: false,
    },
    assertVisible: {
      server: 'playwright',
      tool: 'browser_assert_visible',
      description: 'Assert element is visible',
      cacheable: false,
    },
  },

  // Tavily MCP - 4 tools for web research
  web_research: {
    search: {
      server: 'tavily',
      tool: 'tavily-search',
      description: 'Search the web for information',
      cacheable: true,
    },
    extract: {
      server: 'tavily',
      tool: 'tavily-extract',
      description: 'Extract content from URL',
      cacheable: true,
    },
    crawl: {
      server: 'tavily',
      tool: 'tavily-crawl',
      description: 'Crawl website for content',
      cacheable: true,
    },
    map: {
      server: 'tavily',
      tool: 'tavily-map',
      description: 'Map website structure',
      cacheable: true,
    },
  },

  // shadcn MCP - 7 tools for UI component management
  ui_components: {
    getProjectRegistries: {
      server: 'shadcn',
      tool: 'get_project_registries',
      description: 'Get configured registry names from components.json',
      cacheable: true,
    },
    listItemsInRegistries: {
      server: 'shadcn',
      tool: 'list_items_in_registries',
      description: 'List items from registries (requires registries parameter)',
      cacheable: true,
    },
    searchItemsInRegistries: {
      server: 'shadcn',
      tool: 'search_items_in_registries',
      description: 'Search for components using fuzzy matching',
      cacheable: true,
    },
    viewItemsInRegistries: {
      server: 'shadcn',
      tool: 'view_items_in_registries',
      description: 'View detailed information about specific registry items',
      cacheable: true,
    },
    getItemExamplesFromRegistries: {
      server: 'shadcn',
      tool: 'get_item_examples_from_registries',
      description: 'Find usage examples and demos with complete code',
      cacheable: true,
    },
    getAddCommandForItems: {
      server: 'shadcn',
      tool: 'get_add_command_for_items',
      description: 'Get the shadcn CLI add command for specific items',
      cacheable: true,
    },
    getAuditChecklist: {
      server: 'shadcn',
      tool: 'get_audit_checklist',
      description: 'Get verification checklist after creating components',
      cacheable: true,
    },
  },
};

/**
 * Get operation mapping by category and operation name
 */
export function getOperationMapping(
  category: OperationCategory,
  operation: string
): OperationMapping | undefined {
  return OPERATION_REGISTRY[category]?.[operation];
}

/**
 * List all operations for a category
 */
export function listOperations(category: OperationCategory): string[] {
  return Object.keys(OPERATION_REGISTRY[category] || {});
}

/**
 * Get all cacheable operations for a server
 */
export function getCacheableOperations(server: ServerName): string[] {
  const operations: string[] = [];

  for (const category of Object.values(OPERATION_REGISTRY)) {
    for (const [name, mapping] of Object.entries(category) as [string, OperationMapping][]) {
      if (mapping.server === server && mapping.cacheable) {
        operations.push(name);
      }
    }
  }

  return operations;
}

/**
 * Validate if an operation exists
 */
export function isValidOperation(category: OperationCategory, operation: string): boolean {
  return !!OPERATION_REGISTRY[category]?.[operation];
}
