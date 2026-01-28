# Integration Guide

This guide covers how to integrate your MCP server with various clients and applications.

## Table of Contents

- [Overview](#overview)
- [Client Integration](#client-integration)
- [Transport Options](#transport-options)
- [Claude Desktop Integration](#claude-desktop-integration)
- [Custom Client Development](#custom-client-development)
- [Testing Integration](#testing-integration)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Overview

MCP servers can be integrated with various clients:

- Claude Desktop
- Custom applications
- VS Code extensions
- Web applications
- Command-line tools

## Client Integration

### Basic Client Setup

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const client = new Client(
  {
    name: 'my-client',
    version: '1.0.0',
  },
  {
    capabilities: {},
  }
);
```

### Connecting to Server

```typescript
async function connectToServer() {
  // Spawn server process
  const serverProcess = spawn('node', ['path/to/server/index.js'], {
    stdio: ['pipe', 'pipe', 'inherit'],
  });

  // Create transport
  const transport = new StdioClientTransport({
    reader: serverProcess.stdout,
    writer: serverProcess.stdin,
  });

  // Connect
  await client.connect(transport);
  console.log('Connected to MCP server');
}
```

### Using Tools

```typescript
async function useTool() {
  // List available tools
  const { tools } = await client.listTools();
  console.log('Available tools:', tools);

  // Call a tool
  const result = await client.callTool({
    name: 'calculator',
    arguments: {
      operation: 'add',
      a: 5,
      b: 3,
    },
  });

  console.log('Result:', result.content[0].text);
}
```

## Transport Options

### 1. stdio Transport

Best for local processes and command-line tools:

```typescript
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Server
const serverTransport = new StdioServerTransport();
await server.connect(serverTransport);

// Client
const clientTransport = new StdioClientTransport({
  reader: process.stdin,
  writer: process.stdout,
});
await client.connect(clientTransport);
```

### 2. HTTP Transport

Best for web applications and REST APIs:

```typescript
// Server
import express from 'express';
const app = express();

app.post('/mcp', async (req, res) => {
  const result = await handleMcpRequest(req.body);
  res.json(result);
});

app.listen(3000);

// Client
const response = await fetch('http://localhost:3000/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(mcpRequest),
});
```

### 3. WebSocket Transport

Best for real-time bidirectional communication:

```typescript
// Server
import WebSocket from 'ws';
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    const result = await handleMcpRequest(JSON.parse(message));
    ws.send(JSON.stringify(result));
  });
});

// Client
const ws = new WebSocket('ws://localhost:8080');
ws.on('open', () => {
  ws.send(JSON.stringify(mcpRequest));
});
```

## Claude Desktop Integration

### Configuration File

Add your server to Claude Desktop's configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### TypeScript Server (requires build)

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "node",
      "args": ["/path/to/project/dist/index.js"]
    }
  }
}
```

### Using with npx

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "npx",
      "args": ["-y", "my-mcp-server-package"]
    }
  }
}
```

### Environment Variables

Pass configuration through environment variables:

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://localhost/mydb",
        "API_KEY": "secret-key",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

### Testing in Claude Desktop

1. Add server to configuration file
2. Restart Claude Desktop
3. Verify server appears in tools list
4. Test tool functionality in a conversation

## Custom Client Development

### Full Client Example

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

export class MCPClient {
  private client: Client;
  private serverProcess: any;
  private transport: StdioClientTransport | null = null;

  constructor(private serverPath: string) {
    this.client = new Client(
      {
        name: 'custom-mcp-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );
  }

  async connect(): Promise<void> {
    // Spawn server
    this.serverProcess = spawn('node', [this.serverPath], {
      stdio: ['pipe', 'pipe', 'inherit'],
    });

    // Handle server errors
    this.serverProcess.on('error', (error: Error) => {
      console.error('Server process error:', error);
    });

    this.serverProcess.on('exit', (code: number) => {
      console.log(`Server process exited with code ${code}`);
    });

    // Create transport
    this.transport = new StdioClientTransport({
      reader: this.serverProcess.stdout,
      writer: this.serverProcess.stdin,
    });

    // Connect client
    await this.client.connect(this.transport);
  }

  async listTools(): Promise<any[]> {
    const response = await this.client.listTools();
    return response.tools;
  }

  async callTool(name: string, args: any): Promise<any> {
    const response = await this.client.callTool({
      name,
      arguments: args,
    });
    return JSON.parse(response.content[0].text);
  }

  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.client.close();
      this.serverProcess.kill();
    }
  }
}

// Usage
const client = new MCPClient('/path/to/server/index.js');
await client.connect();

const tools = await client.listTools();
console.log('Available tools:', tools);

const result = await client.callTool('calculator', {
  operation: 'add',
  a: 5,
  b: 3,
});
console.log('Result:', result);

await client.disconnect();
```

### Error Handling

```typescript
export class MCPClient {
  async callTool(name: string, args: any): Promise<any> {
    try {
      const response = await this.client.callTool({
        name,
        arguments: args,
      });

      return JSON.parse(response.content[0].text);
    } catch (error) {
      if (error.code === 'METHOD_NOT_FOUND') {
        throw new Error(`Tool '${name}' not found`);
      }

      if (error.code === 'INVALID_PARAMS') {
        throw new Error(`Invalid parameters for tool '${name}': ${error.message}`);
      }

      throw new Error(`Tool execution failed: ${error.message}`);
    }
  }

  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        await this.delay(Math.pow(2, i) * 1000); // Exponential backoff
      }
    }

    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### Connection Management

```typescript
export class MCPClient {
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect(): Promise<void> {
    try {
      await this.performConnect();
      this.reconnectAttempts = 0;
    } catch (error) {
      await this.handleConnectionError(error as Error);
    }
  }

  private async handleConnectionError(error: Error): Promise<void> {
    console.error('Connection failed:', error);

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      await new Promise((resolve) => setTimeout(resolve, delay));
      await this.connect();
    } else {
      throw new Error('Max reconnection attempts reached');
    }
  }

  async ensureConnected(): Promise<void> {
    if (!this.transport) {
      await this.connect();
    }
  }
}
```

## Testing Integration

### Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { MCPClient } from './client';

describe('MCP Integration Tests', () => {
  let client: MCPClient;

  beforeAll(async () => {
    client = new MCPClient('/path/to/server/index.js');
    await client.connect();
  });

  afterAll(async () => {
    await client.disconnect();
  });

  it('should list tools', async () => {
    const tools = await client.listTools();
    expect(tools).toBeInstanceOf(Array);
    expect(tools.length).toBeGreaterThan(0);
  });

  it('should execute calculator tool', async () => {
    const result = await client.callTool('calculator', {
      operation: 'add',
      a: 5,
      b: 3,
    });

    expect(result.result).toBe(8);
  });

  it('should handle errors gracefully', async () => {
    await expect(
      client.callTool('calculator', {
        operation: 'divide',
        a: 10,
        b: 0,
      })
    ).rejects.toThrow();
  });
});
```

### End-to-End Tests

```typescript
describe('E2E Tests', () => {
  it('should complete full workflow', async () => {
    const client = new MCPClient('/path/to/server/index.js');

    // Connect
    await client.connect();

    // List tools
    const tools = await client.listTools();
    expect(tools).toBeDefined();

    // Execute multiple tools
    const calc = await client.callTool('calculator', {
      operation: 'multiply',
      a: 6,
      b: 7,
    });
    expect(calc.result).toBe(42);

    const weather = await client.callTool('weather', {
      location: 'San Francisco',
    });
    expect(weather.location).toBe('San Francisco');

    // Cleanup
    await client.disconnect();
  });
});
```

## Deployment

### Docker Deployment

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  mcp-server:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - API_KEY=${API_KEY}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

### systemd Service

```ini
[Unit]
Description=MCP Server
After=network.target

[Service]
Type=simple
User=mcpserver
WorkingDirectory=/opt/mcp-server
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
```

### Environment Configuration

```bash
# .env file
NODE_ENV=production
LOG_LEVEL=info
API_KEY=your-api-key
DATABASE_URL=postgresql://localhost/mydb
ALLOWED_ORIGINS=https://example.com
```

## Troubleshooting

### Common Issues

#### Server Not Starting

```typescript
// Add debug logging
console.error('Starting MCP server...');
console.error('Node version:', process.version);
console.error('Working directory:', process.cwd());

// Check for missing dependencies
try {
  require('@modelcontextprotocol/sdk');
  console.error('SDK loaded successfully');
} catch (error) {
  console.error('Failed to load SDK:', error);
}
```

#### Connection Issues

```typescript
// Verify transport is working
this.serverProcess.stdout.on('data', (data) => {
  console.log('Server output:', data.toString());
});

this.serverProcess.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});
```

#### Tool Execution Failures

```typescript
// Add detailed error logging
this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.error('Tool call received:', {
    name: request.params.name,
    args: request.params.arguments,
  });

  try {
    const result = await this.handleToolCall(request);
    console.error('Tool call succeeded:', result);
    return result;
  } catch (error) {
    console.error('Tool call failed:', error);
    throw error;
  }
});
```

### Debug Mode

```typescript
class MCPServer {
  constructor(private debug: boolean = false) {
    if (this.debug) {
      this.enableDebugLogging();
    }
  }

  private enableDebugLogging(): void {
    this.server.onerror = (error) => {
      console.error('[DEBUG] MCP Error:', error);
      console.error('[DEBUG] Stack trace:', error.stack);
    };

    // Log all requests
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error('[DEBUG] ListTools request received');
      const result = await this.handleListTools();
      console.error('[DEBUG] ListTools response:', result);
      return result;
    });
  }
}
```

### Health Checks

```typescript
export class MCPClient {
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.listTools();
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  async monitorHealth(intervalMs: number = 30000): Promise<void> {
    setInterval(async () => {
      const healthy = await this.healthCheck();
      if (!healthy) {
        console.error('Server is unhealthy, attempting reconnect...');
        await this.connect();
      }
    }, intervalMs);
  }
}
```

## Conclusion

Integrating MCP servers requires understanding:

- Transport layer selection
- Client lifecycle management
- Error handling and recovery
- Deployment considerations
- Testing strategies

Following this guide will help you successfully integrate your MCP server with various clients and environments.
