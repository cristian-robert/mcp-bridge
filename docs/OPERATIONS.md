# Complete Operations Reference

Comprehensive listing of all 57 operations accessible through the MCP Bridge.

## Operation Categories

- [Code Operations (Serena)](#code-operations-serena---23-tools) - 23 tools
- [Documentation Lookup (Context7)](#documentation-lookup-context7---2-tools) - 2 tools
- [Browser Testing (Playwright)](#browser-testing-playwright---21-tools) - 21 tools
- [Web Research (Tavily)](#web-research-tavily---4-tools) - 4 tools
- [UI Components (shadcn)](#ui-components-shadcn---7-tools) - 7 tools

---

## Code Operations (Serena) - 23 Tools

### Search Operations (5 tools)

#### 1. findSymbol
**Purpose**: Find symbols (functions, classes, variables) in codebase
**Cacheable**: ✅ Yes
**Parameters**:
- `name_path` (string, required): Symbol name or path
- `include_body` (boolean, optional): Include implementation code

**Example**:
```json
{
  "operation": "findSymbol",
  "params": {
    "name_path": "AuthService.login",
    "include_body": true
  }
}
```

#### 2. findReferencingSymbols
**Purpose**: Find all references to a symbol
**Cacheable**: ✅ Yes
**Parameters**:
- `symbol_id` (string, required): Symbol identifier
- `max_depth` (number, optional): Search depth

#### 3. findFiles
**Purpose**: Search for files by name or pattern
**Cacheable**: ✅ Yes
**Parameters**:
- `pattern` (string, required): File name pattern
- `max_results` (number, optional): Limit results

#### 4. findDirectory
**Purpose**: Search for directories by name or pattern
**Cacheable**: ✅ Yes
**Parameters**:
- `pattern` (string, required): Directory name pattern
- `max_results` (number, optional): Limit results

#### 5. searchInFiles
**Purpose**: Search for text content across files
**Cacheable**: ✅ Yes
**Parameters**:
- `query` (string, required): Search query
- `file_pattern` (string, optional): Filter by file pattern
- `max_results` (number, optional): Limit results

### Edit Operations (6 tools)

#### 6. editFile
**Purpose**: Edit file content with semantic understanding
**Cacheable**: ❌ No
**Parameters**:
- `file_path` (string, required): Path to file
- `edits` (array, required): Array of { old_text, new_text }

#### 7. writeFile
**Purpose**: Write content to a file
**Cacheable**: ❌ No
**Parameters**:
- `file_path` (string, required): Path to file
- `content` (string, required): File content
- `create_dirs` (boolean, optional): Create parent directories

#### 8. createFile
**Purpose**: Create a new file
**Cacheable**: ❌ No
**Parameters**:
- `file_path` (string, required): Path to new file
- `content` (string, required): Initial content

#### 9. deleteFile
**Purpose**: Delete a file
**Cacheable**: ❌ No
**Parameters**:
- `file_path` (string, required): Path to file

#### 10. renameFile
**Purpose**: Rename or move a file
**Cacheable**: ❌ No
**Parameters**:
- `old_path` (string, required): Current path
- `new_path` (string, required): New path

#### 11. moveFile
**Purpose**: Move a file to a different location
**Cacheable**: ❌ No
**Parameters**:
- `source_path` (string, required): Source path
- `destination_path` (string, required): Destination path

### Memory Operations (4 tools)

#### 12. readMemory
**Purpose**: Read session memory/context
**Cacheable**: ✅ Yes
**Parameters**:
- `memory_file_name` (string, required): Memory identifier

#### 13. writeMemory
**Purpose**: Write to session memory/context
**Cacheable**: ❌ No
**Parameters**:
- `memory_file_name` (string, required): Memory identifier
- `content` (string, required): Memory content

#### 14. deleteMemory
**Purpose**: Delete session memory/context
**Cacheable**: ❌ No
**Parameters**:
- `memory_file_name` (string, required): Memory identifier

#### 15. listMemories
**Purpose**: List all session memories
**Cacheable**: ❌ No
**Parameters**: None

### Project Operations (2 tools)

#### 16. getProjectStructure
**Purpose**: Get overall project structure
**Cacheable**: ✅ Yes
**Parameters**:
- `max_depth` (number, optional): Directory depth

#### 17. analyzeProject
**Purpose**: Perform deep project analysis
**Cacheable**: ✅ Yes
**Parameters**:
- `focus` (array, optional): Focus areas

### Thinking Operations (4 tools)

#### 18. thinkAboutTaskAdherence
**Purpose**: Reflect on task adherence and progress
**Cacheable**: ❌ No
**Parameters**:
- `context` (object, optional): Task context

#### 19. thinkAboutCollectedInformation
**Purpose**: Reflect on collected information
**Cacheable**: ❌ No
**Parameters**:
- `context` (object, optional): Information context

#### 20. thinkAboutWhetherYouAreDone
**Purpose**: Reflect on task completion status
**Cacheable**: ❌ No
**Parameters**:
- `context` (object, optional): Completion context

#### 21. thinkAboutCurrentTask
**Purpose**: Reflect on current task context
**Cacheable**: ❌ No
**Parameters**:
- `context` (object, optional): Task context

### Session Operations (2 tools)

#### 22. getSessionInfo
**Purpose**: Get current session information
**Cacheable**: ❌ No
**Parameters**: None

#### 23. updateSessionInfo
**Purpose**: Update session information
**Cacheable**: ❌ No
**Parameters**:
- `session_data` (object, required): Session information

---

## Documentation Lookup (Context7) - 2 Tools

#### 24. resolveLibraryId
**Purpose**: Convert library name to Context7 ID
**Cacheable**: ✅ Yes
**Parameters**:
- `library_name` (string, required): Library name (e.g., "react")

#### 25. getLibraryDocs
**Purpose**: Get official documentation for a library
**Cacheable**: ✅ Yes
**Parameters**:
- `library_id` (string, required): Context7 library ID
- `query` (string, optional): Specific query
- `section` (string, optional): Documentation section

---

## Browser Testing (Playwright) - 21 Tools

### Navigation (4 tools)

#### 26. navigate
**Purpose**: Navigate to a URL
**Cacheable**: ❌ No
**Parameters**:
- `url` (string, required): Target URL
- `wait_until` (string, optional): "load" | "domcontentloaded" | "networkidle"

#### 27. goBack
**Purpose**: Navigate back in history
**Cacheable**: ❌ No
**Parameters**: None

#### 28. goForward
**Purpose**: Navigate forward in history
**Cacheable**: ❌ No
**Parameters**: None

#### 29. reload
**Purpose**: Reload current page
**Cacheable**: ❌ No
**Parameters**: None

### Interaction (7 tools)

#### 30. click
**Purpose**: Click an element
**Cacheable**: ❌ No
**Parameters**:
- `selector` (string, required): CSS selector
- `button` (string, optional): "left" | "right" | "middle"

#### 31. fill
**Purpose**: Fill input field
**Cacheable**: ❌ No
**Parameters**:
- `selector` (string, required): CSS selector
- `value` (string, required): Input value

#### 32. select
**Purpose**: Select dropdown option
**Cacheable**: ❌ No
**Parameters**:
- `selector` (string, required): CSS selector
- `value` (string, required): Option value

#### 33. check
**Purpose**: Check checkbox
**Cacheable**: ❌ No
**Parameters**:
- `selector` (string, required): CSS selector

#### 34. uncheck
**Purpose**: Uncheck checkbox
**Cacheable**: ❌ No
**Parameters**:
- `selector` (string, required): CSS selector

#### 35. hover
**Purpose**: Hover over element
**Cacheable**: ❌ No
**Parameters**:
- `selector` (string, required): CSS selector

#### 36. press
**Purpose**: Press keyboard key
**Cacheable**: ❌ No
**Parameters**:
- `key` (string, required): Key name
- `selector` (string, optional): Target element

### Inspection (3 tools)

#### 37. takeSnapshot
**Purpose**: Take page snapshot (HTML)
**Cacheable**: ❌ No
**Parameters**: None

#### 38. getElements
**Purpose**: Get elements matching selector
**Cacheable**: ❌ No
**Parameters**:
- `selector` (string, required): CSS selector

#### 39. evaluate
**Purpose**: Evaluate JavaScript in page context
**Cacheable**: ❌ No
**Parameters**:
- `expression` (string, required): JavaScript code

### Control (3 tools)

#### 40. setViewportSize
**Purpose**: Set browser viewport size
**Cacheable**: ❌ No
**Parameters**:
- `width` (number, required): Viewport width
- `height` (number, required): Viewport height

#### 41. close
**Purpose**: Close browser page
**Cacheable**: ❌ No
**Parameters**: None

#### 42. newPage
**Purpose**: Open new browser page
**Cacheable**: ❌ No
**Parameters**: None

### Testing (4 tools)

#### 43. waitForSelector
**Purpose**: Wait for element to appear
**Cacheable**: ❌ No
**Parameters**:
- `selector` (string, required): CSS selector
- `timeout` (number, optional): Timeout in ms

#### 44. waitForNavigation
**Purpose**: Wait for navigation to complete
**Cacheable**: ❌ No
**Parameters**:
- `wait_until` (string, optional): "load" | "domcontentloaded" | "networkidle"

#### 45. screenshot
**Purpose**: Take page screenshot
**Cacheable**: ❌ No
**Parameters**:
- `full_page` (boolean, optional): Capture full page
- `path` (string, optional): Save path

#### 46. assertVisible
**Purpose**: Assert element is visible
**Cacheable**: ❌ No
**Parameters**:
- `selector` (string, required): CSS selector

---

## Web Research (Tavily) - 4 Tools

#### 47. search
**Purpose**: Search the web for information
**Cacheable**: ✅ Yes
**Parameters**:
- `query` (string, required): Search query
- `max_results` (number, optional): Number of results (default: 5)
- `search_depth` (string, optional): "basic" | "advanced"

#### 48. extract
**Purpose**: Extract content from URL
**Cacheable**: ✅ Yes
**Parameters**:
- `url` (string, required): Target URL

#### 49. crawl
**Purpose**: Crawl website for content
**Cacheable**: ✅ Yes
**Parameters**:
- `url` (string, required): Starting URL
- `max_pages` (number, optional): Maximum pages to crawl

#### 50. map
**Purpose**: Map website structure
**Cacheable**: ✅ Yes
**Parameters**:
- `url` (string, required): Website URL

---

---

## UI Components (shadcn) - 7 Tools

### Registry Operations (7 tools)

#### 47. getProjectRegistries
**Purpose**: Get configured registry names from components.json
**Cacheable**: ✅ Yes
**Parameters**: None

**Example**:
```json
{
  "operation": "getProjectRegistries",
  "params": {}
}
```

#### 48. listItemsInRegistries
**Purpose**: List all available components from registries
**Cacheable**: ✅ Yes
**Parameters**:
- `registries` (array, required): Array of registry names (e.g., ['@shadcn'])
- `limit` (number, optional): Maximum items to return
- `offset` (number, optional): Skip items for pagination

**Example**:
```json
{
  "operation": "listItemsInRegistries",
  "params": {
    "registries": ["@shadcn"],
    "limit": 20
  }
}
```

#### 49. searchItemsInRegistries
**Purpose**: Search for components using fuzzy matching
**Cacheable**: ✅ Yes
**Parameters**:
- `registries` (array, required): Array of registry names
- `query` (string, required): Search query
- `limit` (number, optional): Maximum results
- `offset` (number, optional): Skip results for pagination

**Example**:
```json
{
  "operation": "searchItemsInRegistries",
  "params": {
    "registries": ["@shadcn"],
    "query": "button"
  }
}
```

#### 50. viewItemsInRegistries
**Purpose**: View detailed information about specific registry items
**Cacheable**: ✅ Yes
**Parameters**:
- `items` (array, required): Array of item names with registry prefix (e.g., ['@shadcn/button'])

**Example**:
```json
{
  "operation": "viewItemsInRegistries",
  "params": {
    "items": ["@shadcn/button", "@shadcn/card"]
  }
}
```

#### 51. getItemExamplesFromRegistries
**Purpose**: Find usage examples and demos with complete code
**Cacheable**: ✅ Yes
**Parameters**:
- `registries` (array, required): Array of registry names
- `query` (string, required): Search query (e.g., 'button-demo', 'card example')

**Example**:
```json
{
  "operation": "getItemExamplesFromRegistries",
  "params": {
    "registries": ["@shadcn"],
    "query": "button-demo"
  }
}
```

#### 52. getAddCommandForItems
**Purpose**: Get the shadcn CLI add command for specific items
**Cacheable**: ✅ Yes
**Parameters**:
- `items` (array, required): Array of items prefixed with registry (e.g., ['@shadcn/button'])

**Example**:
```json
{
  "operation": "getAddCommandForItems",
  "params": {
    "items": ["@shadcn/button", "@shadcn/dialog"]
  }
}
```

#### 53. getAuditChecklist
**Purpose**: Get verification checklist after creating components
**Cacheable**: ✅ Yes
**Parameters**: None

**Example**:
```json
{
  "operation": "getAuditChecklist",
  "params": {}
}
```

---

## Cacheable Operations Summary

**Total Cacheable: 22/57 (39%)**

Cacheable operations are optimized for read-heavy workloads with TTL-based caching:

- **Serena**: 7/23 cacheable (all search, read, and project operations)
- **Context7**: 2/2 cacheable (all documentation lookups)
- **Playwright**: 0/21 cacheable (browser automation is stateful)
- **Tavily**: 4/4 cacheable (all web research operations)
- **shadcn**: 7/7 cacheable (all UI component operations are read-only)

## Performance Characteristics

| Category | Avg Duration | Typical Token Usage | Cache Hit Rate |
|----------|--------------|---------------------|----------------|
| Search Ops | 100-300ms | 300-800 tokens | 60-80% |
| Edit Ops | 150-500ms | 200-500 tokens | 0% |
| Memory Ops | 50-150ms | 100-300 tokens | 40-60% |
| Docs Lookup | 200-600ms | 500-1500 tokens | 70-90% |
| Browser Ops | 300-2000ms | 400-1200 tokens | 0% |
| Web Research | 500-3000ms | 600-2000 tokens | 50-70% |
| UI Components | 150-500ms | 400-1000 tokens | 70-85% |

## Best Practices

1. **Use Batch Operations**: Combine independent operations for parallel execution
2. **Leverage Caching**: Repeated searches benefit from caching
3. **Memory Management**: Use Serena memory operations for session context
4. **Browser Workflows**: Chain browser operations in batch for efficiency
5. **Documentation First**: Check docs before web research for faster results
6. **UI Components**: Use getProjectRegistries first, then search/list operations
7. **shadcn Setup**: Ensure components.json exists before using UI component operations
