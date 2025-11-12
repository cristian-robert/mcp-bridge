# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MCP Bridge Server**: A token-efficient Model Context Protocol aggregator that reduces MCP overhead by 95%+ by consolidating 57 downstream tools into 5-6 category-based bridge tools.

**Architecture**: Acts as a middleware layer between Claude Code and multiple MCP servers (Serena, Context7, Playwright, Tavily, shadcn), providing unified access with intelligent routing, caching, and parallel execution.

## Development Commands

### Build & Run
```bash
npm run build              # Compile TypeScript to dist/
npm start                  # Run compiled server
npm run dev                # Development with hot reload (tsx watch)
npm run clean              # Remove dist/ directory
```

### Testing
```bash
npm test                   # Run all tests (requires --experimental-vm-modules)
npm run test:unit          # Unit tests only (cache, error-handler, parallel-executor)
npm run test:integration   # Integration tests (full bridge server workflow)
```

### Code Quality
```bash
npm run lint               # ESLint all TypeScript files
npm run format             # Prettier formatting
```

## Architecture Overview

### Core Components

**BridgeServer** (`src/bridge-server.ts`)
- Central orchestrator managing downstream MCP clients
- Handles initialization, operation routing, and shutdown lifecycle
- Coordinates cache, error handler, executor, and metrics

**Operation Registry** (`src/registry/operation-registry.ts`)
- Maps 50 downstream tools to 4 bridge categories
- Defines which operations are cacheable
- Routes operations to correct downstream server

**MCP Protocol Handler** (`src/protocol/mcp-protocol.ts`)
- JSON-RPC 2.0 request/response handling
- Stdio transport for Claude Code communication
- Tool listing and execution coordination

### Client Architecture

All downstream clients (`src/clients/`) follow the same pattern:
1. Extend generic `MCPClient` base class
2. Configure server command and arguments
3. Handle server-specific initialization (e.g., Serena's `notifications/initialized` handshake)

**Client Initialization Order**:
- Serena: Requires `notifications/initialized` notification listener before `tools/list`
- Others: Standard MCP handshake (initialize → tools/list → ready)

### Performance Layers

**ResponseCache** (`src/cache/response-cache.ts`)
- TTL-based caching (default: 300s)
- LRU eviction when max size reached
- Only caches read-only operations (flagged in registry)

**ParallelExecutor** (`src/execution/parallel-executor.ts`)
- Concurrent operation execution with configurable limit (default: 10)
- Used by `batch_operations` tool
- Collects results and errors from all operations

**ErrorHandler** (`src/execution/error-handler.ts`)
- Exponential backoff retry logic (max 3 attempts)
- Handles transient failures gracefully
- Preserves partial results on batch failures

**ResponseFormatter** (`src/utils/response-formatter.ts`)
- Compresses responses by removing verbose metadata
- Truncates large outputs to token limits
- Estimates token usage for metrics

## Bridge Tools Schema

The server exposes 5-6 tools to Claude Code (defined in `src/registry/tool-schemas.ts`):

1. **code_operations**: Serena's 23 tools (search, edit, memory, project analysis, thinking)
2. **documentation_lookup**: Context7's 2 tools (library resolution and docs)
3. **browser_testing**: Playwright's 21 tools (navigation, interaction, inspection)
4. **web_research**: Tavily's 4 tools (search, extract, crawl, map)
5. **ui_components**: shadcn's 7 tools (registry management, component search, examples)
6. **batch_operations**: Parallel execution of multiple operations

Each tool accepts `operation` (string) and `params` (object) matching the downstream tool's schema.

## Configuration

### Environment Variables

**Required** `.env` file (copy from `.env.example`):
- `TAVILY_API_KEY`: Required for Tavily web research operations

**Optional** - All have sensible defaults, only override if needed:
- `LOG_LEVEL`: Logging verbosity (default: info)
- `CACHE_ENABLED`: Toggle caching (default: true)
- `CACHE_TTL_SECONDS`: Cache lifetime (default: 300)
- `MAX_CONCURRENT_OPERATIONS`: Parallel execution limit (default: 10)
- `METRICS_ENABLED`: Enable monitoring dashboard (default: true)

### Server Enablement

All MCP servers are **enabled by default**. Disable only if needed:
- `SERENA_ENABLED=false` - Disable code operations
- `CONTEXT7_ENABLED=false` - Disable documentation lookup
- `PLAYWRIGHT_ENABLED=false` - Disable browser testing
- `TAVILY_ENABLED=false` - Disable web research
- `SHADCN_ENABLED=false` - Disable UI components

### Downstream Commands

Customize server commands if needed:
- `SERENA_COMMAND`: Default uses uvx with git+https://github.com/oraios/serena
- `CONTEXT7_COMMAND`: Default uses npx -y @upstash/context7-mcp
- `PLAYWRIGHT_COMMAND`: Default uses npx -y @playwright/mcp
- `TAVILY_COMMAND`: Default uses npx -y tavily-mcp@latest
- `SHADCN_COMMAND`: Default uses npx shadcn@latest mcp

## TypeScript Configuration

- **Module System**: ES Modules (type: "module" in package.json)
- **Target**: ES2022
- **Strict Mode**: Enabled
- **Output**: dist/ directory with source maps and declarations
- **Important**: All imports must use `.js` extension (TypeScript convention for ES modules)

## Testing Strategy

### Unit Tests (`tests/unit/`)
- **cache.test.ts**: TTL expiration, LRU eviction, cache invalidation
- **error-handler.test.ts**: Retry logic, exponential backoff, error types
- **parallel-executor.test.ts**: Concurrent execution, result collection, error handling

### Integration Tests (`tests/integration/`)
- **bridge-server.test.ts**: Full workflow (initialization → operation → shutdown)

**Test Execution**: Requires `--experimental-vm-modules` flag for Jest with ES modules

## Monitoring

When `METRICS_ENABLED=true`, the server displays a real-time ASCII dashboard showing:
- Operation counts and success rates
- Token efficiency metrics (bridge vs direct MCP comparison)
- Cache hit rates and size
- Parallel execution statistics
- Per-server performance metrics

Metrics are exported to `./metrics/` directory on shutdown.

## Key Implementation Details

### Operation Routing Logic

1. Claude Code calls bridge tool (e.g., `code_operations`)
2. Bridge validates operation exists in registry
3. Registry maps operation to downstream server and tool name
4. Cache checked if operation is cacheable
5. ErrorHandler wraps execution with retry logic
6. Response formatted and returned to Claude

### Serena-Specific Handling

Serena requires special initialization:
1. Spawn server process
2. Send `initialize` request
3. Wait for `notifications/initialized` notification (not just response)
4. Then call `tools/list`

This is handled in `src/clients/serena-client.ts` with the notification listener.

### Batch Operations

The `batch_operations` tool:
1. Accepts array of operations with categories
2. Routes each to appropriate bridge category
3. Executes all in parallel via ParallelExecutor
4. Returns array of results (preserving order)
5. Includes partial results even if some operations fail

## Common Patterns

### Adding a New Downstream Server

1. Create client in `src/clients/[server]-client.ts` extending MCPClient
2. Add server to ServerName type in `src/protocol/types.ts`
3. Add category to OperationCategory type
4. Register operations in `src/registry/operation-registry.ts`
5. Create bridge tool schema in `src/registry/tool-schemas.ts`
6. Add initialization logic in `src/bridge-server.ts`
7. Add env vars for enablement and command configuration

### Adding a New Operation

1. Add to appropriate category in `OPERATION_REGISTRY`
2. Specify downstream server and tool name
3. Set cacheable flag appropriately
4. Document in `docs/OPERATIONS.md`

## Dependencies

- **@modelcontextprotocol/sdk**: MCP protocol implementation (JSON-RPC, stdio transport)
- **zod**: Schema validation for bridge tools
- **winston**: Structured logging
- **dotenv**: Environment configuration
- **jest + ts-jest**: Testing framework for ES modules

## Runtime Requirements

- Node.js ≥18.0.0
- Downstream servers must be independently available:
  - Serena: Requires uv/uvx installed
  - Others: Available via npx

## Project Structure Philosophy

- **src/protocol/**: MCP protocol handling and type definitions
- **src/clients/**: Downstream server client implementations
- **src/registry/**: Operation mappings and tool schemas
- **src/cache/**: Response caching layer
- **src/execution/**: Error handling and parallel execution
- **src/monitoring/**: Metrics collection and dashboard
- **src/utils/**: Logging and response formatting
- **tests/**: Unit and integration test suites
- **docs/**: Complete API reference and operation guides

## Token Efficiency Achievement

**Primary Goal**: Reduce Claude Code's context consumption from ~57,000 tokens (loading all 57 tool schemas) to ~1,800 tokens (loading 5-6 bridge tool schemas).

**Mechanism**: Category-based aggregation where Claude Code calls high-level bridge tools and the bridge server handles routing to specific downstream tools without exposing their schemas.

## shadcn Integration

The bridge server integrates shadcn MCP for UI component management. The `ui_components` category provides 7 operations:

1. **getProjectRegistries**: Get configured registry names from components.json
2. **listItemsInRegistries**: List all available components from registries
3. **searchItemsInRegistries**: Search for components using fuzzy matching
4. **viewItemsInRegistries**: View detailed information about specific items
5. **getItemExamplesFromRegistries**: Get usage examples and demos with code
6. **getAddCommandForItems**: Generate shadcn CLI add commands
7. **getAuditChecklist**: Get verification checklist for components

**Note**: shadcn MCP requires a valid `components.json` file in the project root to function properly.
