import { RssItem, RssConfig } from "./types";

export class RssService {
  private serviceUrl: string;
  private jwtToken?: string;

  constructor(
    config: RssConfig,
  ) {
    if (!config.serviceUrl) {
      throw new Error('RSS service URL is required');
    }

    if (!config.jwtToken) {
      throw new Error('RSS service JWT Token is required');
    }
    
    this.serviceUrl = config.serviceUrl;
    this.jwtToken = config.jwtToken;
  }

  async initialize(): Promise<void> {
    try {
      // Check if service is running with a health check
      const healthCheckResponse = await fetch(`${this.serviceUrl}/`, {
        method: 'GET'
      });

      if (!healthCheckResponse.ok) {
        console.warn(`Warning: RSS service health check returned status ${healthCheckResponse.status}`);
      } else {
        console.log('RSS service is running');
      }
    } catch (error) {
      console.error('Error checking RSS service:', error);
      throw new Error(`Failed to initialize RSS feed: ${error}`);
    }
  }

  async saveItem(item: RssItem): Promise<void> {
    try {
      const response = await fetch(`${this.serviceUrl}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.jwtToken ? { 'Authorization': `Bearer ${this.jwtToken}` } : {})
        },
        body: JSON.stringify(item)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to save item to RSS service: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error saving item to RSS service:', error);
      throw error;
    }
  }
}
