/**
 * Calculator Tool
 * Provides mathematical operations for the MCP server
 */

export interface CalculatorInput {
  operation: 'add' | 'subtract' | 'multiply' | 'divide' | 'power' | 'sqrt';
  a: number;
  b?: number;
}

export interface CalculatorOutput {
  result: number;
  operation: string;
  inputs: {
    a: number;
    b?: number;
  };
}

export class CalculatorTool {
  /**
   * Validates calculator input
   */
  private validateInput(input: CalculatorInput): void {
    if (!input.operation) {
      throw new Error('Operation is required');
    }

    const validOperations = ['add', 'subtract', 'multiply', 'divide', 'power', 'sqrt'];
    if (!validOperations.includes(input.operation)) {
      throw new Error(`Invalid operation. Must be one of: ${validOperations.join(', ')}`);
    }

    if (typeof input.a !== 'number' || isNaN(input.a)) {
      throw new Error('Parameter "a" must be a valid number');
    }

    if (input.operation !== 'sqrt') {
      if (input.b === undefined || typeof input.b !== 'number' || isNaN(input.b)) {
        throw new Error(`Parameter "b" is required for ${input.operation} operation`);
      }
    }

    if (input.operation === 'divide' && input.b === 0) {
      throw new Error('Division by zero is not allowed');
    }

    if (input.operation === 'sqrt' && input.a < 0) {
      throw new Error('Cannot calculate square root of negative number');
    }
  }

  /**
   * Performs the calculation based on the operation
   */
  public calculate(input: CalculatorInput): CalculatorOutput {
    this.validateInput(input);

    let result: number;

    switch (input.operation) {
      case 'add':
        result = input.a + input.b!;
        break;
      case 'subtract':
        result = input.a - input.b!;
        break;
      case 'multiply':
        result = input.a * input.b!;
        break;
      case 'divide':
        result = input.a / input.b!;
        break;
      case 'power':
        result = Math.pow(input.a, input.b!);
        break;
      case 'sqrt':
        result = Math.sqrt(input.a);
        break;
      default:
        throw new Error('Invalid operation');
    }

    return {
      result,
      operation: input.operation,
      inputs: {
        a: input.a,
        ...(input.b !== undefined && { b: input.b })
      }
    };
  }

  /**
   * Returns the tool definition for MCP
   */
  public static getToolDefinition() {
    return {
      name: 'calculator',
      description: 'Performs mathematical operations including add, subtract, multiply, divide, power, and square root',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['add', 'subtract', 'multiply', 'divide', 'power', 'sqrt'],
            description: 'The mathematical operation to perform'
          },
          a: {
            type: 'number',
            description: 'The first operand'
          },
          b: {
            type: 'number',
            description: 'The second operand (not required for sqrt)'
          }
        },
        required: ['operation', 'a']
      }
    };
  }
}
