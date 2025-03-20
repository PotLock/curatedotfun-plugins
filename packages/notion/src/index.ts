import type { DistributorPlugin, ActionArgs } from "@curatedotfun/types";
import { Client } from "@notionhq/client";

type NotionPropertyValue = {
  title?: Array<{
    text: { content: string };
  }>;
  rich_text?: Array<{
    text: { content: string };
  }>;
  date?: {
    start: string;
  };
  number?: number;
  checkbox?: boolean;
  multi_select?: Array<{
    name: string;
  }>;
  url?: string;
  email?: string;
  phone_number?: string;
  select?: {
    name: string;
  };
};

// Supported Notion property types
type NotionPropertyType =
  | "title"
  | "rich_text"
  | "date"
  | "number"
  | "checkbox"
  | "multi_select"
  | "select"
  | "url"
  | "email"
  | "phone";

interface NotionConfig {
  token: string;
  databaseId: string;
  fields: Record<string, NotionPropertyType>; // Map of field names to Notion property types
  [key: string]: string | Record<string, NotionPropertyType> | undefined;
}

export default class NotionPlugin
  implements DistributorPlugin<Record<string, unknown>, NotionConfig>
{
  readonly type = "distributor" as const;
  private client: Client | null = null;
  private databaseId: string | null = null;
  private fields: Record<string, NotionPropertyType> | null = null;

  async initialize(config?: NotionConfig): Promise<void> {
    if (!config) {
      throw new Error("Notion plugin requires configuration");
    }
    if (!config.token) {
      throw new Error("Notion plugin requires token");
    }
    if (!config.databaseId) {
      throw new Error("Notion plugin requires databaseId");
    }

    if (!config.fields) {
      throw new Error("Notion plugin requires fields to be defined");
    }

    this.client = new Client({ auth: config.token });
    this.databaseId = config.databaseId;
    this.fields = config.fields;

    try {
      // Validate credentials by attempting to query the database
      await this.client.databases.retrieve({
        database_id: this.databaseId,
      });
    } catch (error) {
      console.error("Failed to initialize Notion plugin:", error);
      throw new Error("Failed to validate Notion credentials");
    }
  }

  async distribute({
    input,
  }: ActionArgs<Record<string, unknown>, NotionConfig>): Promise<void> {
    if (!this.client || !this.databaseId || !this.fields) {
      throw new Error("Notion plugin not initialized");
    }

    try {
      await this.createPage(input);
    } catch (error) {
      console.error("Failed to create Notion page:", error);
      throw error;
    }
  }

  private formatProperty(value: unknown): NotionPropertyValue {
    if (typeof value === "string") {
      return {
        rich_text: [
          {
            text: {
              content: value.slice(0, 2000), // Notion's limit
            },
          },
        ],
      };
    }

    if (
      value instanceof Date ||
      (typeof value === "string" && !isNaN(Date.parse(value)))
    ) {
      return {
        date: {
          start: new Date(value).toISOString(),
        },
      };
    }

    if (typeof value === "number") {
      return {
        number: value,
      };
    }

    if (typeof value === "boolean") {
      return {
        checkbox: value,
      };
    }

    // For arrays (multi-select)
    if (Array.isArray(value)) {
      return {
        multi_select: value.map((item) => ({ name: String(item) })),
      };
    }

    // Default to rich_text for other types
    return {
      rich_text: [
        {
          text: {
            content: String(value).slice(0, 2000),
          },
        },
      ],
    };
  }

  private formatPropertyWithType(
    value: unknown,
    type: NotionPropertyType,
  ): NotionPropertyValue {
    const stringValue = String(value);
    const truncatedValue = stringValue.slice(0, 2000); // Notion's limit

    switch (type) {
      case "title":
        return {
          title: [
            {
              text: {
                content: truncatedValue,
              },
            },
          ],
        };
      case "rich_text":
        return {
          rich_text: [
            {
              text: {
                content: truncatedValue,
              },
            },
          ],
        };
      case "date":
        try {
          // Handle numeric timestamps that are passed as strings
          if (typeof value === "string" && /^\d+$/.test(value)) {
            return {
              date: {
                start: new Date(parseInt(value, 10)).toISOString(),
              },
            };
          }
          return {
            date: {
              start: new Date(value as string | number | Date).toISOString(),
            },
          };
        } catch (error) {
          console.warn(`Failed to parse date: ${value}. Using current date.`);
          return {
            date: {
              start: new Date().toISOString(),
            },
          };
        }
      case "number":
        const num = Number(value);
        return {
          number: isNaN(num) ? 0 : num,
        };
      case "checkbox":
        return {
          checkbox: Boolean(value),
        };
      case "multi_select":
        if (Array.isArray(value)) {
          return {
            multi_select: value.map((item) => ({ name: String(item) })),
          };
        }
        // If not an array, treat as comma-separated string
        return {
          multi_select: stringValue
            .split(",")
            .map((item) => ({ name: item.trim() })),
        };
      case "select":
        return {
          select: {
            name: truncatedValue,
          },
        };
      case "url":
        return {
          url: truncatedValue,
        };
      case "email":
        return {
          email: truncatedValue,
        };
      case "phone":
        return {
          phone_number: truncatedValue,
        };
      default:
        // Default to rich_text for unknown types
        return {
          rich_text: [
            {
              text: {
                content: truncatedValue,
              },
            },
          ],
        };
    }
  }

  private async createPage(properties: Record<string, unknown>): Promise<void> {
    if (!this.client || !this.databaseId || !this.fields) {
      throw new Error("Notion plugin not initialized");
    }

    const formattedProperties: Record<string, NotionPropertyValue> = {};
    let titlePropertyKey: string | null = null;
    const fieldsConfig = this.fields;

    // Determine which properties to include
    let filteredProperties: Record<string, unknown> = properties;

    // If fields are specified in config, only include those fields
    if (Object.keys(fieldsConfig).length > 0) {
      filteredProperties = {};
      for (const [key, type] of Object.entries(fieldsConfig)) {
        if (key in properties) {
          filteredProperties[key] = properties[key];
        }
      }
    }

    // First, look for a property named "title" or "Title"
    for (const [key] of Object.entries(filteredProperties)) {
      if (key.toLowerCase() === "title") {
        titlePropertyKey = key;
        break;
      }
    }

    // If no title property found, use the first property as title
    if (!titlePropertyKey && Object.keys(filteredProperties).length > 0) {
      titlePropertyKey = Object.keys(filteredProperties)[0];
    } else if (!titlePropertyKey) {
      // If no properties at all, create a default title
      titlePropertyKey = "Title";
      filteredProperties[titlePropertyKey] = "New Item";
    }

    // Format properties based on config types or auto-detect
    for (const [key, value] of Object.entries(filteredProperties)) {
      if (key in fieldsConfig) {
        // Use the specified type from config
        formattedProperties[key] = this.formatPropertyWithType(
          value,
          fieldsConfig[key],
        );
      } else if (key === titlePropertyKey) {
        // Handle title property specially
        formattedProperties[key] = this.formatPropertyWithType(value, "title");
      } else {
        // Auto-detect type for properties not in config
        formattedProperties[key] = this.formatProperty(value);
      }
    }

    await this.client.pages.create({
      parent: {
        database_id: this.databaseId,
      },
      properties: formattedProperties as any, // Type assertion needed due to Notion's complex types
    });
  }
}
