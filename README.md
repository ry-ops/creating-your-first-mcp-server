# Creating Your First MCP Server

<p align="center">
  <img src="hero.svg" alt="Creating Your First MCP Server" width="100%">
</p>

A production-ready TypeScript implementation of a Model Context Protocol (MCP) server with example tools demonstrating best practices for building MCP servers.

## Quick Start

### Installation

```bash
npm install
```

### Build

```bash
npm run build
```

### Run the Server

```bash
npm start
```

### Run Example Client

```bash
npm run example
```

## What is MCP?

The Model Context Protocol (MCP) is an open protocol that standardizes how applications provide context to Large Language Models (LLMs). It enables:

- **Standardized Communication**: A unified way for LLMs to interact with external tools and data sources
- **Tool Integration**: Expose custom functionality that AI models can discover and use
- **Resource Management**: Provide structured access to files, databases, and APIs
- **Prompt Templates**: Define reusable prompts for common tasks

### Key MCP Concepts

1. **Server**: Exposes tools, resources, and prompts that clients can use
2. **Client**: Connects to MCP servers to access their capabilities
3. **Tools**: Executable functions that perform specific tasks
4. **Resources**: Data sources like files, database records, or API endpoints
5. **Prompts**: Reusable prompt templates with parameters

## Project Structure

```
creating-your-first-mcp-server/
├── src/
│   ├── index.ts              # Main MCP server implementation
│   └── tools/
│       ├── calculator.ts      # Mathematical operations tool
│       ├── weather.ts         # Weather information tool
│       └── file-ops.ts        # File operations tool
├── examples/
│   └── client.ts             # Example MCP client usage
├── documentation/
│   ├── MCP-CONCEPTS.md       # In-depth MCP concepts
│   ├── TOOL-DEVELOPMENT.md   # Guide to creating tools
│   └── INTEGRATION.md        # Integration guide
├── package.json
├── tsconfig.json
└── LICENSE
```

## Available Tools

### Calculator Tool
Performs mathematical operations (add, subtract, multiply, divide, power, sqrt).

```typescript
// Example usage
{
  "operation": "add",
  "a": 5,
  "b": 3
}
// Returns: { "result": 8 }
```

### Weather Tool
Retrieves weather information for a location (simulated data for demonstration).

```typescript
// Example usage
{
  "location": "San Francisco"
}
// Returns weather data including temperature, conditions, humidity
```

### File Operations Tool
Performs file system operations (read, write, list, delete).

```typescript
// Example usage
{
  "operation": "read",
  "path": "/path/to/file.txt"
}
// Returns file contents or operation result
```

## Development

### Building

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

### Clean Build Artifacts

```bash
npm run clean
```

## Documentation

For more detailed information, see:

- [MCP Concepts](./documentation/MCP-CONCEPTS.md) - Deep dive into MCP architecture and concepts
- [Tool Development Guide](./documentation/TOOL-DEVELOPMENT.md) - How to create custom tools
- [Integration Guide](./documentation/INTEGRATION.md) - Integrating the server with clients

## Error Handling

This server implements comprehensive error handling:

- Input validation for all tool parameters
- Graceful error messages for clients
- Type-safe error responses
- Logging for debugging

## Security Considerations

- File operations are restricted to safe directories
- Input validation prevents injection attacks
- Error messages don't expose sensitive system information
- Rate limiting can be added for production use

## License

MIT License - Copyright (c) 2026 ry-ops

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Resources

- [MCP Specification](https://modelcontextprotocol.io)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [TypeScript Documentation](https://www.typescriptlang.org)
