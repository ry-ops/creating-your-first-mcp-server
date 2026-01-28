/**
 * File Operations Tool
 * Provides safe file system operations
 * Note: Includes security restrictions for production use
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface FileOpsInput {
  operation: 'read' | 'write' | 'list' | 'delete' | 'exists';
  path: string;
  content?: string;
}

export interface FileOpsOutput {
  success: boolean;
  operation: string;
  path: string;
  data?: string | string[];
  message?: string;
}

export class FileOpsTool {
  private readonly allowedDirectories: string[];

  constructor(allowedDirectories?: string[]) {
    // By default, only allow operations in /tmp and current working directory
    this.allowedDirectories = allowedDirectories || [
      '/tmp',
      process.cwd()
    ];
  }

  /**
   * Validates that the path is within allowed directories
   */
  private async validatePath(filePath: string): Promise<string> {
    const resolvedPath = path.resolve(filePath);

    const isAllowed = this.allowedDirectories.some(dir => {
      const resolvedDir = path.resolve(dir);
      return resolvedPath.startsWith(resolvedDir);
    });

    if (!isAllowed) {
      throw new Error(
        `Access denied. Path must be within allowed directories: ${this.allowedDirectories.join(', ')}`
      );
    }

    return resolvedPath;
  }

  /**
   * Validates file operations input
   */
  private validateInput(input: FileOpsInput): void {
    if (!input.operation) {
      throw new Error('Operation is required');
    }

    const validOperations = ['read', 'write', 'list', 'delete', 'exists'];
    if (!validOperations.includes(input.operation)) {
      throw new Error(`Invalid operation. Must be one of: ${validOperations.join(', ')}`);
    }

    if (!input.path || typeof input.path !== 'string') {
      throw new Error('Path is required and must be a string');
    }

    if (input.operation === 'write' && input.content === undefined) {
      throw new Error('Content is required for write operation');
    }
  }

  /**
   * Reads a file
   */
  private async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
      throw new Error(`Failed to read file: ${(error as Error).message}`);
    }
  }

  /**
   * Writes content to a file
   */
  private async writeFile(filePath: string, content: string): Promise<void> {
    try {
      const directory = path.dirname(filePath);
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file: ${(error as Error).message}`);
    }
  }

  /**
   * Lists files in a directory
   */
  private async listDirectory(dirPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries.map(entry => {
        const prefix = entry.isDirectory() ? '[DIR] ' : '[FILE] ';
        return prefix + entry.name;
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Directory not found: ${dirPath}`);
      }
      throw new Error(`Failed to list directory: ${(error as Error).message}`);
    }
  }

  /**
   * Deletes a file
   */
  private async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
      throw new Error(`Failed to delete file: ${(error as Error).message}`);
    }
  }

  /**
   * Checks if a file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Performs file operation
   */
  public async performOperation(input: FileOpsInput): Promise<FileOpsOutput> {
    this.validateInput(input);

    const validatedPath = await this.validatePath(input.path);

    let result: FileOpsOutput = {
      success: false,
      operation: input.operation,
      path: validatedPath
    };

    try {
      switch (input.operation) {
        case 'read':
          const content = await this.readFile(validatedPath);
          result.success = true;
          result.data = content;
          result.message = 'File read successfully';
          break;

        case 'write':
          await this.writeFile(validatedPath, input.content!);
          result.success = true;
          result.message = 'File written successfully';
          break;

        case 'list':
          const files = await this.listDirectory(validatedPath);
          result.success = true;
          result.data = files;
          result.message = `Found ${files.length} entries`;
          break;

        case 'delete':
          await this.deleteFile(validatedPath);
          result.success = true;
          result.message = 'File deleted successfully';
          break;

        case 'exists':
          const exists = await this.fileExists(validatedPath);
          result.success = true;
          result.data = exists ? 'File exists' : 'File does not exist';
          result.message = exists ? 'File exists' : 'File does not exist';
          break;
      }
    } catch (error) {
      result.success = false;
      result.message = (error as Error).message;
    }

    return result;
  }

  /**
   * Returns the tool definition for MCP
   */
  public static getToolDefinition() {
    return {
      name: 'file_operations',
      description: 'Performs safe file system operations including read, write, list, delete, and exists checks',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['read', 'write', 'list', 'delete', 'exists'],
            description: 'The file operation to perform'
          },
          path: {
            type: 'string',
            description: 'The file or directory path'
          },
          content: {
            type: 'string',
            description: 'Content to write (required for write operation)'
          }
        },
        required: ['operation', 'path']
      }
    };
  }
}
