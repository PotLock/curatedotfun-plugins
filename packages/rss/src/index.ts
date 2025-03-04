import type {
  DistributorPlugin,
  ActionArgs,
} from "@curatedotfun/types";
import { RssItem, RssConfig } from "./types";
import { z } from "zod";

// Define a schema for RSS item input
// Content and link are required, everything else is optional
const RssInputSchema = z.object({
  title: z.string().optional(),
  content: z.string(),
  link: z.string(),
  publishedAt: z.string().optional(),
  guid: z.string().optional(),
  author: z.string().optional(),
  categories: z.array(z.string()).optional(),
  comments: z.string().optional(),
  enclosure: z.object({
    url: z.string(),
    length: z.number(),
    type: z.string()
  }).optional(),
  source: z.object({
    url: z.string(),
    title: z.string()
  }).optional(),
  isPermaLink: z.boolean().optional()
});

type RssInput = z.infer<typeof RssInputSchema>;

export default class RssPlugin implements DistributorPlugin<RssInput, RssConfig> {
  readonly type = "distributor" as const;
  
  // Essential service properties
  private serviceUrl?: string;
  private apiSecret?: string;

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
    if (!config.apiSecret) {
      throw new Error("RSS plugin requires apiSecret");
    }

    // Store only essential configuration
    this.serviceUrl = config.serviceUrl;
    this.apiSecret = config.apiSecret;

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
    input,
    config,
  }: ActionArgs<RssInput, RssConfig>): Promise<void> {
    try {
      // Validate input
      const validatedInput = RssInputSchema.parse(input);
      
      // Create a complete RssItem with defaults for missing fields
      const item: RssItem = {
        // Content & Link are required
        content: validatedInput.content,
        link: validatedInput.link,
        
        // Required fields with defaults if not provided
        publishedAt: validatedInput.publishedAt || new Date().toISOString(),
        guid: validatedInput.guid || `item-${Date.now()}`,
        
        // Optional fields with defaults
        title: validatedInput.title || "New Update",
        
        // Optional fields that are passed through if present
        ...(validatedInput.author && { author: validatedInput.author }),
        ...(validatedInput.categories && { categories: validatedInput.categories }),
        ...(validatedInput.comments && { comments: validatedInput.comments }),
        ...(validatedInput.enclosure && { enclosure: validatedInput.enclosure }),
        ...(validatedInput.source && { source: validatedInput.source }),
        ...(validatedInput.isPermaLink !== undefined && { isPermaLink: validatedInput.isPermaLink })
      };
      
      // Save to RSS service
      await this.saveItem(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid RSS item: ${error.message}`);
      }
      throw error;
    }
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
          ...(this.apiSecret ? { 'Authorization': `Bearer ${this.apiSecret}` } : {})
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
