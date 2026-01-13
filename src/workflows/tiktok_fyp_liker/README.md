# Transcompiled n8n Workflows to LangGraph

This directory contains n8n workflows converted to clean, maintainable LangGraph code.

## Overview

The workflows have been converted following these principles:
- **Readability**: Clean, well-documented code with clear function names
- **Maintainability**: Modular structure with separated concerns
- **Type Safety**: Full TypeScript types throughout
- **Best Practices**: Using LangGraph state graphs for workflow orchestration

## Structure

```
workflows/
├── types.ts                 # State annotations and types
├── nodes.ts                 # Individual node implementations
├── tiktok-fyp-liker.ts     # Main workflow class
├── index.ts                 # Public exports
├── example.ts               # Usage example
└── README.md               # This file
```

## Available Workflows

### TikTok FYP Liker

Automatically likes videos on TikTok's For You Page.

**Features:**
- Device verification
- App lifecycle management (kill/launch)
- Screen size detection
- Smart FYP tab navigation
- AI-powered video interaction
- LIVE stream detection and skipping
- Error handling with screenshots
- Automatic cleanup (return to home)

**Usage:**

```typescript
import { TikTokFypLikerWorkflow } from './workflows';
import { MobileControler } from '../src/mobile';
import mcpsIngester from '../src/ingesters/mcps/mcps.ingester';

// Initialize tools
await mcpsIngester.init();
const tools = mcpsIngester.getTools();
const controller = new MobileControler(tools);

// Create and run workflow
const workflow = new TikTokFypLikerWorkflow(controller, tools);
const result = await workflow.run({
  deviceId: 'YOUR_DEVICE_ID',
  likesCount: 10
});
```

## Workflow Architecture

Each workflow follows this pattern:

1. **State Definition** (`types.ts`)
   - Define state schema using LangGraph Annotations
   - Type all configuration and state fields

2. **Node Functions** (`nodes.ts`)
   - Pure functions for each workflow step
   - Each function takes state and dependencies
   - Returns partial state updates
   - Handles errors gracefully

3. **Workflow Class** (`*.ts`)
   - Orchestrates the graph construction
   - Manages dependencies (controller, model, tools)
   - Defines node connections and edges
   - Provides clean API for execution

4. **Error Handling**
   - Conditional edges for error routing
   - Screenshot capture on failures
   - Cleanup actions (return to home)
   - Error state tracking

## Design Decisions

### Why LangGraph?

- **State Management**: Built-in state passing between nodes
- **Graph Visualization**: Easy to understand workflow structure
- **Error Recovery**: Conditional edges for robust error handling
- **Checkpointing**: Built-in support for resumable workflows

### Node Granularity

Each n8n node is converted to a function because:
- **Testability**: Each node can be unit tested independently
- **Reusability**: Nodes can be shared across workflows
- **Clarity**: Clear responsibilities and boundaries

### Tool Abstraction

Tools are passed as dependencies to:
- **Flexibility**: Easy to mock for testing
- **Decoupling**: Nodes don't depend on global state
- **Type Safety**: Proper typing of tool interfaces

## Adding New Workflows

To convert a new n8n workflow:

1. **Analyze the n8n JSON**
   - Identify all nodes and their connections
   - Map node types to functions
   - Extract configuration values

2. **Define State Schema**
   - Add new annotation in `types.ts`
   - Include all data that flows between nodes

3. **Implement Nodes**
   - Create functions in `nodes.ts` or new file
   - Follow the signature pattern: `(state, ...deps) => Promise<Partial<State>>`
   - Handle errors consistently

4. **Build Workflow Class**
   - Create new class similar to `TikTokFypLikerWorkflow`
   - Add nodes with `.addNode()`
   - Connect with `.addEdge()` and `.addConditionalEdges()`
   - Compile and expose `run()` method

5. **Export and Document**
   - Add exports to `index.ts`
   - Create usage example
   - Update README

## Benefits Over n8n

✅ **Version Control**: Code is easily diffable and trackable
✅ **Testing**: Unit tests for individual nodes
✅ **Type Safety**: Compile-time error detection
✅ **Debugging**: Standard debugging tools work
✅ **Performance**: No runtime overhead from visual editor
✅ **Portability**: Pure TypeScript, runs anywhere
✅ **Maintainability**: Clean code with clear structure

## Environment Variables

Required:
- `GEMINI_API_KEY`: Google Gemini API key for AI agent

## Running Examples

```bash
# Build the project
pnpm build

# Run example
node dist/n8n/workflows/example.js
```

## Notes

- Functions are kept short and focused (avoid very long functions)
- No over-engineering - straightforward implementations
- Comments explain "why" not "what"
- Tools follow the mobile MCP interface
- All async operations are properly awaited
