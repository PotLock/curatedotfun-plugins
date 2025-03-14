import type { ActionArgs, DistributorPlugin } from "@curatedotfun/types";
import { RssConfig } from "./types";

interface RssInput {
  // Core fields
  title?: string;
  content?: string;
  description?: string;
  link?: string;
  publishedAt?: string;
  guid?: string;

  // Author information
  author?:
    | {
        name: string;
        email?: string;
        link?: string;
      }
    | Array<{
        name: string;
        email?: string;
        link?: string;
      }>;

  // Media and categorization
  image?:
    | string
    | {
        url: string;
        type?: string;
        length?: number;
      };
  audio?:
    | string
    | {
        url: string;
        type?: string;
        length?: number;
      };
  video?:
    | string
    | {
        url: string;
        type?: string;
        length?: number;
      };
  enclosure?: {
    url: string;
    type?: string;
    length?: number;
  };
  categories?:
    | string[]
    | Array<{
        name: string;
        domain?: string;
      }>;

  // Additional metadata
  copyright?: string;
  source?: {
    url: string;
    title: string;
  };
  isPermaLink?: boolean;
}

export default class RssPlugin
  implements DistributorPlugin<RssInput, RssConfig>
{
  readonly type = "distributor" as const;

  private serviceUrl?: string;
  private apiSecret?: string;

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

    // Parse and normalize the service URL (ensure no trailing slash)
    try {
      let serviceUrl = config.serviceUrl.trim();
      // Remove trailing slash if present
      if (serviceUrl.endsWith("/")) {
        serviceUrl = serviceUrl.slice(0, -1);
      }
      // Validate it's a proper URL
      new URL(serviceUrl);
      this.serviceUrl = serviceUrl;
    } catch (error) {
      throw new Error(`Invalid service URL: ${config.serviceUrl}`);
    }

    this.apiSecret = config.apiSecret.trim();

    // Check if service is running with a health check
    try {
      const healthCheckResponse = await fetch(`${this.serviceUrl}/health`, {
        method: "GET",
      });

      if (!healthCheckResponse.ok) {
        console.warn(
          `Warning: RSS service health check returned status ${healthCheckResponse.status}`,
        );
        throw new Error(
          `RSS service health check failed, tried: ${this.serviceUrl}/health`,
        );
      }

      // If feed configuration is provided, update it on the service
      if (config.feedConfig) {
        if (!config.feedConfig.siteUrl)
          config.feedConfig.siteUrl = this.serviceUrl;
        const updateConfigResponse = await fetch(
          `${this.serviceUrl}/api/config`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.apiSecret}`,
            },
            body: JSON.stringify(config.feedConfig),
          },
        );

        if (!updateConfigResponse.ok) {
          const errorData = await updateConfigResponse.json();
          console.warn(
            `Warning: Failed to update RSS feed configuration: ${errorData.error || updateConfigResponse.statusText}`,
          );
        } else {
          console.log("Successfully updated RSS feed configuration");
        }
      }
    } catch (error) {
      console.error("Error initializing RSS service:", error);
      throw new Error(`Failed to initialize RSS feed: ${error}`);
    }
  }

  async distribute({ input }: ActionArgs<RssInput, RssConfig>): Promise<void> {
    if (!this.serviceUrl) {
      throw new Error("RSS service URL is required");
    }

    try {
      const response = await fetch(`${this.serviceUrl}/api/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiSecret
            ? { Authorization: `Bearer ${this.apiSecret}` }
            : {}),
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Failed to save item to RSS service: ${errorData.error || response.statusText}`,
        );
      }

      console.log("Successfully saved RSS item");
    } catch (error) {
      console.error("Error saving item to RSS service:", error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    // No cleanup needed
  }
}
