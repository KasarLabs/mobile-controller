import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { DynamicStructuredTool } from 'langchain';

export class McpsIngester {
  private tools: DynamicStructuredTool[] = [];
  constructor() {
    // Constructor implementation
  }

  /**
   * init
   */
  public async init() {
    const client = new MultiServerMCPClient({
      // Global tool configuration options
      // Whether to throw on errors if a tool fails to load (optional, default: true)
      throwOnLoadError: false,
      // Whether to prefix tool names with the server name (optional, default: false)
      prefixToolNameWithServerName: false,
      // Optional additional prefix for tool names (optional, default: "")
      additionalToolNamePrefix: '',

      // Use standardized content block format in tool outputs
      useStandardContentBlocks: true,

      // Server configuration
      mcpServers: {
        // adds a STDIO connection to a server named "math"
        'mobile-mcp': {
          command: 'npx',
          args: ['-y', '@mobilenext/mobile-mcp@latest'],
          env: {
            ...process.env,
            // Suppress MCP server logs
            LOG_FILE: 'error', // Only show errors
          },
          stderr: "ignore"
        },
      },
    });
    // Implementation for McpsIngester
    this.tools = await client.getTools();
  }

  public getTools(): DynamicStructuredTool[] {
    return this.tools;
  }
}

const mcpsIngester = new McpsIngester();
export default mcpsIngester;
