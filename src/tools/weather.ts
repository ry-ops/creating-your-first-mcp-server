/**
 * Weather Tool
 * Provides weather information for locations
 * Note: This is a simulated implementation for demonstration purposes
 */

export interface WeatherInput {
  location: string;
  units?: 'celsius' | 'fahrenheit';
}

export interface WeatherOutput {
  location: string;
  temperature: number;
  units: string;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: Array<{
    day: string;
    high: number;
    low: number;
    condition: string;
  }>;
  timestamp: string;
}

export class WeatherTool {
  private readonly conditions = [
    'Sunny',
    'Partly Cloudy',
    'Cloudy',
    'Rainy',
    'Stormy',
    'Snowy',
    'Foggy',
    'Windy'
  ];

  private readonly days = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ];

  /**
   * Validates weather input
   */
  private validateInput(input: WeatherInput): void {
    if (!input.location || typeof input.location !== 'string') {
      throw new Error('Location is required and must be a string');
    }

    if (input.location.trim().length === 0) {
      throw new Error('Location cannot be empty');
    }

    if (input.units && !['celsius', 'fahrenheit'].includes(input.units)) {
      throw new Error('Units must be either "celsius" or "fahrenheit"');
    }
  }

  /**
   * Generates simulated weather data
   * In a real implementation, this would call a weather API
   */
  private generateWeatherData(location: string, units: 'celsius' | 'fahrenheit'): WeatherOutput {
    const isCelsius = units === 'celsius';
    const baseTemp = isCelsius ? 20 : 68;
    const tempVariation = isCelsius ? 10 : 18;

    const temperature = Math.round(baseTemp + (Math.random() * tempVariation - tempVariation / 2));
    const condition = this.conditions[Math.floor(Math.random() * this.conditions.length)];
    const humidity = Math.round(30 + Math.random() * 50);
    const windSpeed = Math.round(5 + Math.random() * 20);

    const forecast = this.days.map(day => ({
      day,
      high: Math.round(temperature + Math.random() * 5),
      low: Math.round(temperature - Math.random() * 5),
      condition: this.conditions[Math.floor(Math.random() * this.conditions.length)]
    }));

    return {
      location,
      temperature,
      units: isCelsius ? 'Celsius' : 'Fahrenheit',
      condition,
      humidity,
      windSpeed,
      forecast,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Gets weather information for a location
   */
  public getWeather(input: WeatherInput): WeatherOutput {
    this.validateInput(input);

    const units = input.units || 'celsius';
    return this.generateWeatherData(input.location, units);
  }

  /**
   * Returns the tool definition for MCP
   */
  public static getToolDefinition() {
    return {
      name: 'weather',
      description: 'Retrieves current weather information and forecast for a specified location',
      inputSchema: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The location to get weather for (e.g., "San Francisco", "New York", "London")'
          },
          units: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            description: 'Temperature units (default: celsius)',
            default: 'celsius'
          }
        },
        required: ['location']
      }
    };
  }
}
