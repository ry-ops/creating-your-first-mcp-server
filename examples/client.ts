#!/usr/bin/env node

/**
 * Example MCP Client
 * Demonstrates how to connect to and use the MCP server
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import * as path from 'path';

/**
 * Example MCP Client Class
 */
class ExampleMCPClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;

  constructor() {
    this.client = new Client(
      {
        name: 'example-mcp-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );
  }

  /**
   * Connects to the MCP server
   */
  async connect(): Promise<void> {
    const serverPath = path.join(__dirname, '../dist/index.js');

    // Spawn the server process
    const serverProcess = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'inherit'],
    });

    // Create transport
    this.transport = new StdioClientTransport({
      reader: serverProcess.stdout,
      writer: serverProcess.stdin,
    });

    await this.client.connect(this.transport);
    console.log('Connected to MCP server\n');
  }

  /**
   * Lists available tools
   */
  async listTools(): Promise<void> {
    console.log('=== Available Tools ===');
    const response = await this.client.listTools();

    response.tools.forEach((tool) => {
      console.log(`\nTool: ${tool.name}`);
      console.log(`Description: ${tool.description}`);
      console.log(`Input Schema:`, JSON.stringify(tool.inputSchema, null, 2));
    });
    console.log('\n');
  }

  /**
   * Example: Use calculator tool
   */
  async exampleCalculator(): Promise<void> {
    console.log('=== Calculator Tool Example ===');

    // Addition
    console.log('\n1. Addition: 15 + 7');
    let result = await this.client.callTool({
      name: 'calculator',
      arguments: {
        operation: 'add',
        a: 15,
        b: 7,
      },
    });
    console.log('Result:', result.content[0].text);

    // Multiplication
    console.log('\n2. Multiplication: 8 * 9');
    result = await this.client.callTool({
      name: 'calculator',
      arguments: {
        operation: 'multiply',
        a: 8,
        b: 9,
      },
    });
    console.log('Result:', result.content[0].text);

    // Square root
    console.log('\n3. Square root: sqrt(144)');
    result = await this.client.callTool({
      name: 'calculator',
      arguments: {
        operation: 'sqrt',
        a: 144,
      },
    });
    console.log('Result:', result.content[0].text);

    console.log('\n');
  }

  /**
   * Example: Use weather tool
   */
  async exampleWeather(): Promise<void> {
    console.log('=== Weather Tool Example ===');

    console.log('\n1. Weather in San Francisco (Celsius)');
    let result = await this.client.callTool({
      name: 'weather',
      arguments: {
        location: 'San Francisco',
        units: 'celsius',
      },
    });
    console.log('Result:', result.content[0].text);

    console.log('\n2. Weather in New York (Fahrenheit)');
    result = await this.client.callTool({
      name: 'weather',
      arguments: {
        location: 'New York',
        units: 'fahrenheit',
      },
    });
    console.log('Result:', result.content[0].text);

    console.log('\n');
  }

  /**
   * Example: Use file operations tool
   */
  async exampleFileOps(): Promise<void> {
    console.log('=== File Operations Tool Example ===');

    const testFilePath = '/tmp/mcp-test.txt';
    const testContent = 'Hello from MCP Server!';

    // Write file
    console.log('\n1. Writing file:', testFilePath);
    let result = await this.client.callTool({
      name: 'file_operations',
      arguments: {
        operation: 'write',
        path: testFilePath,
        content: testContent,
      },
    });
    console.log('Result:', result.content[0].text);

    // Check if file exists
    console.log('\n2. Checking if file exists');
    result = await this.client.callTool({
      name: 'file_operations',
      arguments: {
        operation: 'exists',
        path: testFilePath,
      },
    });
    console.log('Result:', result.content[0].text);

    // Read file
    console.log('\n3. Reading file');
    result = await this.client.callTool({
      name: 'file_operations',
      arguments: {
        operation: 'read',
        path: testFilePath,
      },
    });
    console.log('Result:', result.content[0].text);

    // Delete file
    console.log('\n4. Deleting file');
    result = await this.client.callTool({
      name: 'file_operations',
      arguments: {
        operation: 'delete',
        path: testFilePath,
      },
    });
    console.log('Result:', result.content[0].text);

    console.log('\n');
  }

  /**
   * Example: Error handling
   */
  async exampleErrorHandling(): Promise<void> {
    console.log('=== Error Handling Example ===');

    try {
      console.log('\n1. Attempting division by zero');
      await this.client.callTool({
        name: 'calculator',
        arguments: {
          operation: 'divide',
          a: 10,
          b: 0,
        },
      });
    } catch (error) {
      console.log('Error caught:', (error as Error).message);
    }

    try {
      console.log('\n2. Attempting to read non-existent file');
      await this.client.callTool({
        name: 'file_operations',
        arguments: {
          operation: 'read',
          path: '/tmp/does-not-exist.txt',
        },
      });
    } catch (error) {
      console.log('Error caught:', (error as Error).message);
    }

    console.log('\n');
  }

  /**
   * Closes the connection
   */
  async close(): Promise<void> {
    if (this.transport) {
      await this.client.close();
      console.log('Disconnected from MCP server');
    }
  }
}

/**
 * Main function
 */
async function main() {
  const client = new ExampleMCPClient();

  try {
    // Connect to server
    await client.connect();

    // List available tools
    await client.listTools();

    // Run examples
    await client.exampleCalculator();
    await client.exampleWeather();
    await client.exampleFileOps();
    await client.exampleErrorHandling();

    console.log('All examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the client if executed directly
if (require.main === module) {
  main();
}

export { ExampleMCPClient };
