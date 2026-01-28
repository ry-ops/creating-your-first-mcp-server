# Tool Development Guide

This guide walks you through creating custom tools for your MCP server.

## Table of Contents

- [Tool Basics](#tool-basics)
- [Tool Structure](#tool-structure)
- [Creating a Tool](#creating-a-tool)
- [Input Validation](#input-validation)
- [Error Handling](#error-handling)
- [Testing Tools](#testing-tools)
- [Best Practices](#best-practices)
- [Advanced Topics](#advanced-topics)

## Tool Basics

A tool in MCP is a function that can be called by an LLM to perform a specific task. Tools consist of:

1. **Definition**: Metadata describing the tool
2. **Input Schema**: JSON Schema defining expected parameters
3. **Handler**: Implementation logic
4. **Output Format**: Structured response

## Tool Structure

### Basic Tool Class

```typescript
export class MyTool {
  /**
   * Validates input
   */
  private validateInput(input: MyInput): void {
    // Validation logic
  }

  /**
   * Performs the operation
   */
  public execute(input: MyInput): MyOutput {
    this.validateInput(input);
    // Implementation logic
    return result;
  }

  /**
   * Returns tool definition
   */
  public static getToolDefinition() {
    return {
      name: 'my_tool',
      description: 'What the tool does',
      inputSchema: {
        // JSON Schema
      }
    };
  }
}
```

## Creating a Tool

### Step 1: Define Interfaces

Define TypeScript interfaces for input and output:

```typescript
export interface MyToolInput {
  operation: 'action1' | 'action2';
  parameter1: string;
  parameter2?: number;
}

export interface MyToolOutput {
  success: boolean;
  data: any;
  message: string;
}
```

### Step 2: Create Tool Class

```typescript
export class MyTool {
  constructor(private config?: ToolConfig) {
    // Initialize with optional configuration
  }

  private validateInput(input: MyToolInput): void {
    if (!input.operation) {
      throw new Error('Operation is required');
    }

    if (!input.parameter1) {
      throw new Error('Parameter1 is required');
    }

    // Additional validation
  }

  public async execute(input: MyToolInput): Promise<MyToolOutput> {
    this.validateInput(input);

    try {
      // Tool implementation
      const result = await this.performOperation(input);

      return {
        success: true,
        data: result,
        message: 'Operation completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: (error as Error).message
      };
    }
  }

  private async performOperation(input: MyToolInput): Promise<any> {
    switch (input.operation) {
      case 'action1':
        return await this.action1(input);
      case 'action2':
        return await this.action2(input);
      default:
        throw new Error('Invalid operation');
    }
  }

  private async action1(input: MyToolInput): Promise<any> {
    // Implementation
  }

  private async action2(input: MyToolInput): Promise<any> {
    // Implementation
  }

  public static getToolDefinition() {
    return {
      name: 'my_tool',
      description: 'Performs custom operations',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['action1', 'action2'],
            description: 'The operation to perform'
          },
          parameter1: {
            type: 'string',
            description: 'First parameter'
          },
          parameter2: {
            type: 'number',
            description: 'Optional second parameter'
          }
        },
        required: ['operation', 'parameter1']
      }
    };
  }
}
```

### Step 3: Register Tool in Server

Add the tool to your MCP server:

```typescript
import { MyTool } from './tools/my-tool.js';

class MCPServer {
  private myTool: MyTool;

  constructor() {
    // Initialize
    this.myTool = new MyTool();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          MyTool.getToolDefinition(),
          // ... other tools
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'my_tool') {
        return await this.handleMyTool(args);
      }

      // ... other tools
    });
  }

  private async handleMyTool(args: any) {
    try {
      const result = await this.myTool.execute(args);
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
        `Tool error: ${(error as Error).message}`
      );
    }
  }
}
```

## Input Validation

### Type Validation

```typescript
private validateInput(input: ToolInput): void {
  // Check required fields
  if (input.requiredField === undefined) {
    throw new Error('requiredField is required');
  }

  // Type checking
  if (typeof input.stringField !== 'string') {
    throw new Error('stringField must be a string');
  }

  if (typeof input.numberField !== 'number' || isNaN(input.numberField)) {
    throw new Error('numberField must be a valid number');
  }

  // Array validation
  if (!Array.isArray(input.arrayField)) {
    throw new Error('arrayField must be an array');
  }

  // Enum validation
  const validOptions = ['option1', 'option2', 'option3'];
  if (!validOptions.includes(input.enumField)) {
    throw new Error(`enumField must be one of: ${validOptions.join(', ')}`);
  }
}
```

### Value Validation

```typescript
private validateInput(input: ToolInput): void {
  // Range validation
  if (input.age < 0 || input.age > 150) {
    throw new Error('age must be between 0 and 150');
  }

  // Length validation
  if (input.text.length > 1000) {
    throw new Error('text must not exceed 1000 characters');
  }

  // Pattern validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(input.email)) {
    throw new Error('Invalid email format');
  }

  // Custom validation
  if (input.startDate > input.endDate) {
    throw new Error('startDate must be before endDate');
  }
}
```

### Schema Validation

Use JSON Schema for comprehensive validation:

```typescript
import Ajv from 'ajv';

const ajv = new Ajv();

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    age: { type: 'number', minimum: 0, maximum: 150 },
    email: { type: 'string', format: 'email' }
  },
  required: ['name', 'age']
};

const validate = ajv.compile(schema);

function validateInput(input: any): void {
  if (!validate(input)) {
    throw new Error(JSON.stringify(validate.errors));
  }
}
```

## Error Handling

### Structured Errors

```typescript
class ToolError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ToolError';
  }
}

// Usage
throw new ToolError(
  'INVALID_INPUT',
  'Parameter validation failed',
  { field: 'email', value: input.email }
);
```

### Try-Catch Patterns

```typescript
public async execute(input: ToolInput): Promise<ToolOutput> {
  try {
    // Validation
    this.validateInput(input);

    // Operation
    const result = await this.performOperation(input);

    return {
      success: true,
      data: result
    };

  } catch (error) {
    // Log error
    console.error('Tool execution failed:', error);

    // Handle specific errors
    if (error instanceof ToolError) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }

    // Handle unexpected errors
    return {
      success: false,
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    };
  }
}
```

### Resource Cleanup

```typescript
public async execute(input: ToolInput): Promise<ToolOutput> {
  let resource: Resource | null = null;

  try {
    resource = await this.acquireResource();
    const result = await this.useResource(resource, input);
    return result;

  } catch (error) {
    throw error;

  } finally {
    // Always clean up
    if (resource) {
      await this.releaseResource(resource);
    }
  }
}
```

## Testing Tools

### Unit Tests

```typescript
import { describe, it, expect } from '@jest/globals';
import { MyTool } from './my-tool';

describe('MyTool', () => {
  let tool: MyTool;

  beforeEach(() => {
    tool = new MyTool();
  });

  it('should execute successfully with valid input', async () => {
    const input = {
      operation: 'action1',
      parameter1: 'test'
    };

    const result = await tool.execute(input);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should throw error for invalid input', async () => {
    const input = {
      operation: 'invalid',
      parameter1: 'test'
    };

    await expect(tool.execute(input)).rejects.toThrow();
  });

  it('should handle missing required parameters', async () => {
    const input = {
      operation: 'action1'
    };

    await expect(tool.execute(input)).rejects.toThrow('Parameter1 is required');
  });
});
```

### Integration Tests

```typescript
describe('MyTool Integration', () => {
  it('should work end-to-end', async () => {
    const tool = new MyTool({
      apiKey: 'test-key',
      timeout: 5000
    });

    const result = await tool.execute({
      operation: 'action1',
      parameter1: 'test-data'
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      // Expected structure
    });
  });
});
```

## Best Practices

### 1. Single Responsibility

Each tool should do one thing well:

```typescript
// Good: Specific tool
class EmailSenderTool {
  public async sendEmail(input: EmailInput) {
    // Send email logic
  }
}

// Bad: Too many responsibilities
class CommunicationTool {
  public async sendEmail() { }
  public async sendSMS() { }
  public async makeCall() { }
  public async sendPushNotification() { }
}
```

### 2. Clear Naming

Use descriptive names:

```typescript
// Good
class DataValidatorTool { }
class FileCompressorTool { }
class ImageResizerTool { }

// Bad
class ToolA { }
class Helper { }
class Utility { }
```

### 3. Comprehensive Documentation

```typescript
/**
 * Email Sender Tool
 *
 * Sends emails using configured SMTP server.
 *
 * @example
 * ```typescript
 * const tool = new EmailSenderTool({
 *   smtpHost: 'smtp.example.com',
 *   smtpPort: 587
 * });
 *
 * await tool.sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Hello',
 *   body: 'Email content'
 * });
 * ```
 */
export class EmailSenderTool {
  /**
   * Sends an email
   *
   * @param input - Email parameters
   * @returns Result of send operation
   * @throws {ToolError} If email validation fails
   * @throws {NetworkError} If SMTP connection fails
   */
  public async sendEmail(input: EmailInput): Promise<EmailOutput> {
    // Implementation
  }
}
```

### 4. Configuration

Make tools configurable:

```typescript
interface ToolConfig {
  timeout?: number;
  retries?: number;
  apiKey?: string;
  endpoint?: string;
}

export class MyTool {
  private readonly config: Required<ToolConfig>;

  constructor(config?: ToolConfig) {
    this.config = {
      timeout: config?.timeout ?? 30000,
      retries: config?.retries ?? 3,
      apiKey: config?.apiKey ?? process.env.API_KEY ?? '',
      endpoint: config?.endpoint ?? 'https://api.example.com'
    };
  }
}
```

### 5. Logging

Add comprehensive logging:

```typescript
export class MyTool {
  private log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}] [MyTool] ${message}`, data || '');
  }

  public async execute(input: ToolInput): Promise<ToolOutput> {
    this.log('info', 'Executing tool', { input });

    try {
      const result = await this.performOperation(input);
      this.log('info', 'Tool executed successfully', { result });
      return result;

    } catch (error) {
      this.log('error', 'Tool execution failed', { error });
      throw error;
    }
  }
}
```

## Advanced Topics

### Async Operations

```typescript
export class AsyncTool {
  public async execute(input: ToolInput): Promise<ToolOutput> {
    // Parallel operations
    const [result1, result2, result3] = await Promise.all([
      this.operation1(),
      this.operation2(),
      this.operation3()
    ]);

    // Sequential with timeout
    const result = await Promise.race([
      this.longOperation(),
      this.timeout(5000)
    ]);

    return result;
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), ms);
    });
  }
}
```

### Caching

```typescript
export class CachedTool {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTTL = 60000; // 1 minute

  public async execute(input: ToolInput): Promise<ToolOutput> {
    const cacheKey = this.getCacheKey(input);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    const result = await this.performOperation(input);

    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  }

  private getCacheKey(input: ToolInput): string {
    return JSON.stringify(input);
  }
}
```

### Streaming

```typescript
export class StreamingTool {
  public async *executeStream(input: ToolInput): AsyncGenerator<Chunk> {
    const data = await this.fetchLargeData(input);

    for (const chunk of this.processInChunks(data)) {
      yield {
        data: chunk,
        progress: this.calculateProgress()
      };
    }
  }

  private *processInChunks(data: any[]): Generator<any> {
    const chunkSize = 100;
    for (let i = 0; i < data.length; i += chunkSize) {
      yield data.slice(i, i + chunkSize);
    }
  }
}
```

## Conclusion

Building effective MCP tools requires careful attention to:

- Clear interfaces and contracts
- Robust input validation
- Comprehensive error handling
- Thorough testing
- Good documentation

Follow these patterns and practices to create reliable, maintainable tools that enhance your MCP server.
