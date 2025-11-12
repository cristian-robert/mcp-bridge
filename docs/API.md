# API Reference

Complete API documentation for MCP Bridge Server.

## Bridge Tools

### `code_operations`

Execute Serena code analysis, editing, memory, and project operations.

**Input Schema:**
```typescript
{
  operation: string;  // Operation name
  params: object;     // Operation-specific parameters
}
```

**Response:**
```typescript
{
  success: boolean;
  data?: unknown;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
  metadata: {
    serverName: string;
    operationName: string;
    durationMs: number;
    cached: boolean;
    tokensEstimate: number;
  };
}
```

**Available Operations:**

#### Search Operations

##### `findSymbol`
Find symbols (functions, classes, variables) in codebase.

```typescript
{
  operation: "findSymbol",
  params: {
    name_path: string;      // Symbol name or path
    include_body?: boolean; // Include implementation
  }
}
```

##### `findReferencingSymbols`
Find all references to a symbol.

```typescript
{
  operation: "findReferencingSymbols",
  params: {
    symbol_id: string;     // Symbol identifier
    max_depth?: number;    // Search depth
  }
}
```

##### `findFiles`
Search for files by name or pattern.

```typescript
{
  operation: "findFiles",
  params: {
    pattern: string;       // File name pattern
    max_results?: number;  // Limit results
  }
}
```

##### `findDirectory`
Search for directories by name or pattern.

```typescript
{
  operation: "findDirectory",
  params: {
    pattern: string;       // Directory name pattern
    max_results?: number;  // Limit results
  }
}
```

##### `searchInFiles`
Search for text content across files.

```typescript
{
  operation: "searchInFiles",
  params: {
    query: string;         // Search query
    file_pattern?: string; // Filter by file pattern
    max_results?: number;  // Limit results
  }
}
```

#### Edit Operations

##### `editFile`
Edit file content with semantic understanding.

```typescript
{
  operation: "editFile",
  params: {
    file_path: string;     // Path to file
    edits: Array<{
      old_text: string;
      new_text: string;
    }>;
  }
}
```

##### `writeFile`
Write content to a file.

```typescript
{
  operation: "writeFile",
  params: {
    file_path: string;     // Path to file
    content: string;       // File content
    create_dirs?: boolean; // Create parent directories
  }
}
```

##### `createFile`
Create a new file.

```typescript
{
  operation: "createFile",
  params: {
    file_path: string;     // Path to new file
    content: string;       // Initial content
  }
}
```

##### `deleteFile`
Delete a file.

```typescript
{
  operation: "deleteFile",
  params: {
    file_path: string;     // Path to file
  }
}
```

##### `renameFile`
Rename or move a file.

```typescript
{
  operation: "renameFile",
  params: {
    old_path: string;      // Current path
    new_path: string;      // New path
  }
}
```

#### Memory Operations

##### `readMemory`
Read session memory/context.

```typescript
{
  operation: "readMemory",
  params: {
    memory_file_name: string; // Memory identifier
  }
}
```

##### `writeMemory`
Write to session memory/context.

```typescript
{
  operation: "writeMemory",
  params: {
    memory_file_name: string; // Memory identifier
    content: string;          // Memory content
  }
}
```

##### `deleteMemory`
Delete session memory/context.

```typescript
{
  operation: "deleteMemory",
  params: {
    memory_file_name: string; // Memory identifier
  }
}
```

##### `listMemories`
List all session memories.

```typescript
{
  operation: "listMemories",
  params: {}
}
```

#### Project Operations

##### `getProjectStructure`
Get overall project structure.

```typescript
{
  operation: "getProjectStructure",
  params: {
    max_depth?: number;    // Directory depth
  }
}
```

##### `analyzeProject`
Perform deep project analysis.

```typescript
{
  operation: "analyzeProject",
  params: {
    focus?: string[];      // Focus areas
  }
}
```

---

### `documentation_lookup`

Query official library documentation via Context7.

**Input Schema:**
```typescript
{
  operation: string;  // Operation name
  params: object;     // Operation-specific parameters
}
```

**Available Operations:**

#### `resolveLibraryId`
Convert library name to Context7 ID.

```typescript
{
  operation: "resolveLibraryId",
  params: {
    library_name: string;  // Library name (e.g., "react")
  }
}
```

#### `getLibraryDocs`
Get official documentation for a library.

```typescript
{
  operation: "getLibraryDocs",
  params: {
    library_id: string;    // Context7 library ID
    query?: string;        // Specific query
    section?: string;      // Documentation section
  }
}
```

---

### `browser_testing`

Automate browser testing workflows with Playwright.

**Input Schema:**
```typescript
{
  operation: string;  // Operation name
  params: object;     // Operation-specific parameters
}
```

**Available Operations:**

#### Navigation

##### `navigate`
Navigate to a URL.

```typescript
{
  operation: "navigate",
  params: {
    url: string;           // Target URL
    wait_until?: string;   // "load" | "domcontentloaded" | "networkidle"
  }
}
```

##### `goBack`
Navigate back in history.

```typescript
{
  operation: "goBack",
  params: {}
}
```

##### `goForward`
Navigate forward in history.

```typescript
{
  operation: "goForward",
  params: {}
}
```

##### `reload`
Reload current page.

```typescript
{
  operation: "reload",
  params: {}
}
```

#### Interaction

##### `click`
Click an element.

```typescript
{
  operation: "click",
  params: {
    selector: string;      // CSS selector
    button?: string;       // "left" | "right" | "middle"
  }
}
```

##### `fill`
Fill input field.

```typescript
{
  operation: "fill",
  params: {
    selector: string;      // CSS selector
    value: string;         // Input value
  }
}
```

##### `select`
Select dropdown option.

```typescript
{
  operation: "select",
  params: {
    selector: string;      // CSS selector
    value: string;         // Option value
  }
}
```

#### Inspection

##### `takeSnapshot`
Take page snapshot (HTML).

```typescript
{
  operation: "takeSnapshot",
  params: {}
}
```

##### `screenshot`
Take page screenshot.

```typescript
{
  operation: "screenshot",
  params: {
    full_page?: boolean;   // Capture full page
    path?: string;         // Save path
  }
}
```

---

### `web_research`

Perform web search and content extraction via Tavily.

**Input Schema:**
```typescript
{
  operation: string;  // Operation name
  params: object;     // Operation-specific parameters
}
```

**Available Operations:**

#### `search`
Search the web for information.

```typescript
{
  operation: "search",
  params: {
    query: string;         // Search query
    max_results?: number;  // Number of results (default: 5)
    search_depth?: string; // "basic" | "advanced"
  }
}
```

#### `extract`
Extract content from URL.

```typescript
{
  operation: "extract",
  params: {
    url: string;           // Target URL
  }
}
```

#### `crawl`
Crawl website for content.

```typescript
{
  operation: "crawl",
  params: {
    url: string;           // Starting URL
    max_pages?: number;    // Maximum pages to crawl
  }
}
```

#### `map`
Map website structure.

```typescript
{
  operation: "map",
  params: {
    url: string;           // Website URL
  }
}
```

---

### `batch_operations`

Execute multiple operations in parallel across different servers.

**Input Schema:**
```typescript
{
  operations: Array<{
    category: "code_operations" | "documentation_lookup" | "browser_testing" | "web_research";
    operation: string;
    params: object;
  }>;
}
```

**Response:**
```typescript
{
  results: BridgeResponse[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
    durationMs: number;
    tokensEstimate: number;
  };
}
```

**Example:**
```typescript
{
  operations: [
    {
      category: "code_operations",
      operation: "findSymbol",
      params: { name_path: "User" }
    },
    {
      category: "documentation_lookup",
      operation: "getLibraryDocs",
      params: { library_id: "react" }
    },
    {
      category: "web_research",
      operation: "search",
      params: { query: "MCP protocol" }
    }
  ]
}
```

## Error Handling

All operations return a consistent error structure:

```typescript
{
  success: false,
  error: {
    message: string;       // Human-readable error message
    code: string;          // Error code
    details?: unknown;     // Additional error details
  },
  metadata?: {
    serverName: string;
    operationName: string;
    durationMs: number;
    cached: boolean;
  }
}
```

**Common Error Codes:**

- `INVALID_OPERATION`: Operation not found in registry
- `MAPPING_ERROR`: Operation mapping not found
- `SERVER_UNAVAILABLE`: Downstream server not connected
- `EXECUTION_ERROR`: Operation execution failed
- `TIMEOUT_ERROR`: Operation timed out
- `VALIDATION_ERROR`: Invalid parameters

## Caching

Cacheable operations (marked in registry):
- All search operations
- All read operations
- Documentation lookups
- Web research

Cache behavior:
- TTL: 5 minutes (configurable)
- Size: 1000 entries (configurable)
- Eviction: LRU with hit count
- Invalidation: Manual or automatic on TTL expiry

## Rate Limiting

Internal concurrency control:
- Default: 10 concurrent operations
- Configurable via `MAX_CONCURRENT_OPERATIONS`
- Queue-based execution for overflow

## Monitoring

Access metrics programmatically or via dashboard:

```typescript
// Get dashboard data
const dashboard = bridgeServer.getDashboard();

// Export metrics
await bridgeServer.exportMetrics('session-metrics.json');

// Clear cache
bridgeServer.clearCache({ server: 'serena' });
```
