import type { ActionArgs, DistributorPlugin } from "@curatedotfun/types";
import { RssConfig, RssConfigSchema, RssInput, RssInputSchema } from "./types";
import {
  RssConfigurationError,
  RssServiceError,
  RssFeedNotFoundError,
  RssStorageError,
} from "./errors";

export default class RssPlugin
  implements DistributorPlugin<RssInput, RssConfig>
{
  readonly type = "distributor" as const;

  private serviceUrl?: string;
  private apiSecret?: string;
  private feedId?: string;

  async initialize(config?: RssConfig): Promise<void> {
    const parsedConfig = RssConfigSchema.parse(config);

    const { serviceUrl, apiSecret, feedId, feedConfig } = parsedConfig;

    // Parse and normalize the service URL (ensure no trailing slash)
    try {
      let normalizedServiceUrl = serviceUrl.trim();
      // Remove trailing slash if present
      if (normalizedServiceUrl.endsWith("/")) {
        normalizedServiceUrl = normalizedServiceUrl.slice(0, -1);
      }
      // Validate it's a proper URL
      new URL(normalizedServiceUrl);
      this.serviceUrl = normalizedServiceUrl;
    } catch (error) {
      throw new RssConfigurationError(`Invalid service URL: ${serviceUrl}`);
    }

    this.apiSecret = apiSecret.trim();
    this.feedId = feedId;

    // Check if service is running with a health check
    try {
      const healthCheckResponse = await fetch(`${this.serviceUrl}/health`, {
        method: "GET",
      });

      if (!healthCheckResponse.ok) {
        throw new RssServiceError(
          `RSS service health check failed, tried: ${this.serviceUrl}/health`,
          healthCheckResponse.status,
        );
      }

      // If feed configuration is provided, upsert it on the service
      if (feedConfig) {
        if (!feedConfig.siteUrl) {
          feedConfig.siteUrl = this.serviceUrl;
        }

        const updateConfigResponse = await fetch(
          `${this.serviceUrl}/api/feeds/${this.feedId}/config`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.apiSecret}`,
            },
            body: JSON.stringify(feedConfig),
          },
        );

        if (!updateConfigResponse.ok) {
          const errorData = await updateConfigResponse.json().catch(() => ({}));
          throw new RssServiceError(
            `Failed to update RSS feed configuration: ${errorData.message || updateConfigResponse.statusText}`,
            updateConfigResponse.status,
            errorData,
          );
        }

        const result = await updateConfigResponse.json();
        console.log(
          result.created
            ? "Successfully created RSS feed"
            : "Successfully updated RSS feed configuration",
        );
      }
    } catch (error) {
      if (error instanceof RssServiceError) {
        throw error;
      }
      console.error("Error initializing RSS service:", error);
      throw new RssServiceError(`Failed to initialize RSS feed: ${error}`, 500);
    }
  }

  async distribute({ input }: ActionArgs<RssInput, RssConfig>): Promise<void> {
    if (!this.serviceUrl) {
      throw new RssServiceError("RSS service URL is required", 500);
    }
    if (!this.feedId) {
      throw new RssServiceError("RSS feed ID is required", 500);
    }

    try {
      const validatedInput = RssInputSchema.parse(input);

      const response = await fetch(
        `${this.serviceUrl}/api/feeds/${this.feedId}/items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(this.apiSecret
              ? { Authorization: `Bearer ${this.apiSecret}` }
              : {}),
          },
          body: JSON.stringify(validatedInput),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle specific error types based on status code
        if (response.status === 404) {
          throw new RssFeedNotFoundError(this.feedId);
        } else if (response.status === 409) {
          throw new RssServiceError(
            `Duplicate item: ${errorData.message || "Item already exists in feed"}`,
            409,
            errorData,
          );
        } else if (response.status >= 500) {
          throw new RssStorageError(
            errorData.message ||
              "Failed to store the item. Please try again later.",
          );
        } else {
          throw new RssServiceError(
            `Failed to save item to RSS service: ${errorData.message || response.statusText}`,
            response.status,
            errorData,
          );
        }
      }

      console.log("Successfully saved RSS item");
    } catch (error) {
      if (error instanceof RssServiceError) {
        throw error;
      }
      console.error("Error saving item to RSS service:", error);
      throw new RssServiceError(`Failed to distribute RSS item: ${error}`, 500);
    }
  }

  async shutdown(): Promise<void> {
    // No cleanup needed
  }
}
