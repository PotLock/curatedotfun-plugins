import type {
  DistributorPlugin,
  ActionArgs,
} from "@curatedotfun/types";
import { RssItem, RssConfig } from "./types";

export default class RssPlugin implements DistributorPlugin<string, RssConfig> {
  readonly type = "distributor" as const;
  
  // Essential service properties
  private serviceUrl?: string;
  private jwtToken?: string;

  constructor() {
    // No initialization needed
  }

  async initialize(config?: RssConfig): Promise<void> {
    if (!config) {
      throw new Error("RSS plugin requires configuration");
    }
    if (!config.serviceUrl) {
      throw new Error("RSS plugin requires serviceUrl");
    }

    // Store only essential configuration
    this.serviceUrl = config.serviceUrl;
    this.jwtToken = config.jwtToken;

    // Check if service is running with a health check
    try {
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

  async distribute({
    input: content,
    config,
  }: ActionArgs<string, RssConfig>): Promise<void> {
    if (!this.serviceUrl) {
      throw new Error("RSS plugin not initialized");
    }

    // Create a basic RSS item from the input content
    const item: RssItem = {
      title: "New Update", // Default title
      content,
      link: "",
      publishedAt: new Date().toISOString(),
      guid: `item-${Date.now()}`
    };

    // Save to RSS service
    await this.saveItem(item);
  }

  /**
   * Save an item to the RSS service
   */
  private async saveItem(item: RssItem): Promise<void> {
    if (!this.serviceUrl) {
      throw new Error('RSS service URL is required');
    }

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

  async shutdown(): Promise<void> {
    // No cleanup needed
  }
}
