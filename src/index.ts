#!/usr/bin/env node

/**
 * MCP Server Implementation
 * A production-ready Model Context Protocol server with example tools
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';

import { CalculatorTool, CalculatorInput } from './tools/calculator.js';
import { WeatherTool, WeatherInput } from './tools/weather.js';
import { FileOpsTool, FileOpsInput } from './tools/file-ops.js';

/**
 * Main MCP Server Class
 */
class MCPServer {
  private server: Server;
  private calculatorTool: CalculatorTool;
  private weatherTool: WeatherTool;
  private fileOpsTool: FileOpsTool;

  constructor() {
    this.server = new Server(
      {
        name: 'example-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize tools
    this.calculatorTool = new CalculatorTool();
    this.weatherTool = new WeatherTool();
    this.fileOpsTool = new FileOpsTool();

    this.setupHandlers();
    this.setupErrorHandling();
  }

  /**
   * Sets up request handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          CalculatorTool.getToolDefinition(),
          WeatherTool.getToolDefinition(),
          FileOpsTool.getToolDefinition(),
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'calculator':
            return await this.handleCalculator(args as CalculatorInput);

          case 'weather':
            return await this.handleWeather(args as WeatherInput);

          case 'file_operations':
            return await this.handleFileOps(args as FileOpsInput);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }

        // Convert regular errors to MCP errors
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${(error as Error).message}`
        );
      }
    });
  }

  /**
   * Handles calculator tool requests
   */
  private async handleCalculator(args: CalculatorInput) {
    try {
      const result = this.calculatorTool.calculate(args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Calculator error: ${(error as Error).message}`
      );
    }
  }

  /**
   * Handles weather tool requests
   */
  private async handleWeather(args: WeatherInput) {
    try {
      const result = this.weatherTool.getWeather(args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Weather error: ${(error as Error).message}`
      );
    }
  }

  /**
   * Handles file operations tool requests
   */
  private async handleFileOps(args: FileOpsInput) {
    try {
      const result = await this.fileOpsTool.performOperation(args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `File operations error: ${(error as Error).message}`
      );
    }
  }

  /**
   * Sets up error handling
   */
  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Starts the server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP Server running on stdio');
  }
}

/**
 * Main entry point
 */
async function main() {
  try {
    const server = new MCPServer();
    await server.start();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
main();
