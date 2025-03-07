import type { ActionArgs, DistributorPlugin } from "@curatedotfun/types";
import { z } from "zod";
import { RssItem } from "@rss-service/types";
import { RssConfig } from "./types";

// Define a schema for TwitterSubmission input with additional fields for RSS compatibility
const RssItemSchema = z.object({
  // Core fields
  title: z.string().optional(), // Optional custom title
  content: z.string().optional(), // Content of the item
  description: z.string().optional(), // Optional description/summary
  link: z.string().optional(), // URL to the item
  publishedAt: z.string().optional(), // Publication date
  guid: z.string().optional(), // Unique identifier

  // Author information
  author: z
    .object({
      name: z.string(),
      email: z.string().optional(),
      link: z.string().optional(),
    })
    .optional()
    .or(
      z.array(
        z.object({
          name: z.string(),
          email: z.string().optional(),
          link: z.string().optional(),
        }),
      ),
    ), // Author(s) information

  // Media and categorization
  image: z
    .string()
    .optional()
    .or(
      z.object({
        url: z.string(),
        type: z.string().optional(),
        length: z.number().optional(),
      }),
    ), // Image URL or enclosure
  audio: z
    .string()
    .optional()
    .or(
      z.object({
        url: z.string(),
        type: z.string().optional(),
        length: z.number().optional(),
      }),
    ), // Audio URL or enclosure
  video: z
    .string()
    .optional()
    .or(
      z.object({
        url: z.string(),
        type: z.string().optional(),
        length: z.number().optional(),
      }),
    ), // Video URL or enclosure
  enclosure: z
    .object({
      url: z.string(),
      type: z.string().optional(),
      length: z.number().optional(),
    })
    .optional(), // Generic enclosure
  categories: z
    .array(z.string())
    .optional()
    .or(
      z.array(
        z.object({
          name: z.string(),
          domain: z.string().optional(),
        }),
      ),
    ), // Categories/tags

  // Additional metadata
  copyright: z.string().optional(), // Copyright information
  source: z
    .object({
      url: z.string(),
      title: z.string(),
    })
    .optional(), // Source information
  isPermaLink: z.boolean().optional(), // Whether guid is a permalink
});

type RssInput = z.infer<typeof RssItemSchema>;

export default class RssPlugin
  implements DistributorPlugin<RssInput, RssConfig>
{
  readonly type = "distributor" as const;

  // Essential service properties
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

    // Store only essential configuration
    // Parse and normalize the service URL (enforce HTTPS and remove trailing slash)
    try {
      const url = new URL(config.serviceUrl);
      // Enforce HTTPS
      url.protocol = "https:";
      // Remove trailing slash from pathname if present
      if (url.pathname.endsWith("/") && url.pathname.length > 1) {
        url.pathname = url.pathname.slice(0, -1);
      }
      this.serviceUrl = url.toString();
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
      } else {
        console.log("RSS service is running");
      }
    } catch (error) {
      console.error("Error checking RSS service:", error);
      throw new Error(`Failed to initialize RSS feed: ${error}`);
    }
  }

  async distribute({ input }: ActionArgs<RssInput, RssConfig>): Promise<void> {
    try {
      // Validate input
      const validatedInput = RssItemSchema.parse(input);

      // Create a complete RssItem with defaults for missing fields
      const item: RssItem = {
        // Required fields - ensure we have values for these
        content: validatedInput.content || validatedInput.description || "",
        link: validatedInput.link || "",
        guid: validatedInput.guid || validatedInput.link || String(Date.now()), // Use link as fallback or timestamp
        // Ensure dates are in UTC
        published: validatedInput.publishedAt
          ? new Date(validatedInput.publishedAt)
          : new Date(),
        date: new Date(), // Current date

        // Title is required in the Item interface
        title: validatedInput.title || "Untitled",

        // Handle author(s)
        ...(validatedInput.author && {
          author: Array.isArray(validatedInput.author)
            ? validatedInput.author
            : [validatedInput.author],
        }),

        // Handle categories
        ...(validatedInput.categories && {
          category: Array.isArray(validatedInput.categories)
            ? typeof validatedInput.categories[0] === "string"
              ? validatedInput.categories.map((cat) => ({
                  name: cat as string,
                }))
              : (validatedInput.categories as {
                  name: string;
                  domain?: string;
                }[])
            : [
                {
                  name: validatedInput.categories as unknown as string,
                },
              ],
        }),

        // Handle media enclosures
        ...(validatedInput.image && {
          image:
            typeof validatedInput.image === "string"
              ? validatedInput.image
              : validatedInput.image,
        }),

        ...(validatedInput.audio && {
          audio:
            typeof validatedInput.audio === "string"
              ? validatedInput.audio
              : validatedInput.audio,
        }),

        ...(validatedInput.video && {
          video:
            typeof validatedInput.video === "string"
              ? validatedInput.video
              : validatedInput.video,
        }),

        // Additional metadata
        ...(validatedInput.enclosure && {
          enclosure: validatedInput.enclosure,
        }),
        ...(validatedInput.source && { source: validatedInput.source }),
        ...(validatedInput.isPermaLink !== undefined && {
          isPermaLink: validatedInput.isPermaLink,
        }),
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
      throw new Error("RSS service URL is required");
    }

    try {
      // Convert Date objects to ISO strings to ensure proper JSON serialization
      const serializedItem = {
        ...item,
        published:
          item.published instanceof Date
            ? item.published.toISOString()
            : item.published,
        date: item.date instanceof Date ? item.date.toISOString() : item.date,
      };

      const response = await fetch(`${this.serviceUrl}/api/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiSecret
            ? { Authorization: `Bearer ${this.apiSecret}` }
            : {}),
        },
        body: JSON.stringify(serializedItem),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Failed to save item to RSS service: ${errorData.error || response.statusText}`,
        );
      }
    } catch (error) {
      console.error("Error saving item to RSS service:", error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    // No cleanup needed
  }
}
