import { describe, it, expect, vi, beforeEach } from "vitest";
import NotionPlugin from "../index";
import { Client } from "@notionhq/client";

// Mock the Notion client
vi.mock("@notionhq/client");

describe("NotionPlugin", () => {
  let plugin: NotionPlugin;

  beforeEach(() => {
    plugin = new NotionPlugin();
    // Spy on console methods
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});

    // Reset mocks
    vi.clearAllMocks();

    // Setup default mock for Notion client
    vi.mocked(Client).mockImplementation(
      () =>
        ({
          databases: {
            retrieve: vi.fn().mockResolvedValue({ id: "test-database-id" }),
          },
          pages: {
            create: vi.fn().mockResolvedValue({ id: "test-page-id" }),
          },
        }) as any,
    );
  });

  describe("initialization", () => {
    it("should initialize with valid config", async () => {
      await plugin.initialize({
        token: "test-token",
        databaseId: "test-database-id",
        fields: {
          title: "title",
          description: "rich_text",
        },
      });

      expect(Client).toHaveBeenCalledWith({ auth: "test-token" });
      expect(plugin["client"]).not.toBeNull();
      expect(plugin["databaseId"]).toBe("test-database-id");
      expect(plugin["fields"]).toEqual({
        title: "title",
        description: "rich_text",
      });
    });

    it("should throw error when initializing without config", async () => {
      await expect(plugin.initialize()).rejects.toThrow(
        "Notion plugin requires configuration",
      );
    });

    it("should throw error when initializing without token", async () => {
      await expect(
        plugin.initialize({
          databaseId: "test-database-id",
        } as any),
      ).rejects.toThrow("Notion plugin requires token");
    });

    it("should throw error when initializing without databaseId", async () => {
      await expect(
        plugin.initialize({
          token: "test-token",
        } as any),
      ).rejects.toThrow("Notion plugin requires databaseId");
    });

    it("should throw error when database retrieval fails", async () => {
      // Mock the database.retrieve method to throw an error
      const mockClient = {
        databases: {
          retrieve: vi.fn().mockRejectedValue(new Error("Database not found")),
        },
      };
      vi.mocked(Client).mockImplementation(() => mockClient as any);

      await expect(
        plugin.initialize({
          token: "test-token",
          databaseId: "invalid-database-id",
          fields: {
            title: "title",
          },
        }),
      ).rejects.toThrow("Failed to validate Notion credentials");

      expect(console.error).toHaveBeenCalledWith(
        "Failed to initialize Notion plugin:",
        expect.any(Error),
      );
    });
  });

  describe("distribute", () => {
    beforeEach(async () => {
      // Initialize the plugin before each test
      await plugin.initialize({
        token: "test-token",
        databaseId: "test-database-id",
        fields: {
          title: "title",
          description: "rich_text",
          date: "date",
        },
      });
    });

    it("should throw error when distributing without initialization", async () => {
      // Create a new plugin instance without initializing
      const uninitializedPlugin = new NotionPlugin();
      await expect(
        uninitializedPlugin.distribute({
          input: { title: "Test Page" },
          config: {
            token: "test-token",
            databaseId: "test-database-id",
            fields: {
              title: "title",
            },
          },
        }),
      ).rejects.toThrow("Notion plugin not initialized");
    });

    it("should create a page with basic properties", async () => {
      const mockClient = plugin["client"] as any;

      await plugin.distribute({
        input: {
          title: "Test Page",
          description: "This is a test page",
          date: "2023-01-01",
        },
        config: {
          token: "test-token",
          databaseId: "test-database-id",
          fields: {
            title: "title",
            description: "rich_text",
            date: "date",
          },
        },
      });

      expect(mockClient.pages.create).toHaveBeenCalledTimes(1);
      const createArgs = mockClient.pages.create.mock.calls[0][0];

      // Check that the parent database ID is correct
      expect(createArgs.parent.database_id).toBe("test-database-id");

      // Check that the properties include title, description, and date
      expect(createArgs.properties).toHaveProperty("title");
      expect(createArgs.properties).toHaveProperty("description");
      expect(createArgs.properties).toHaveProperty("date");

      // Check that the title is formatted correctly
      expect(createArgs.properties.title).toHaveProperty("title");
      expect(createArgs.properties.title.title[0].text.content).toBe(
        "Test Page",
      );
    });

    it("should handle errors during page creation", async () => {
      const mockClient = plugin["client"] as any;
      mockClient.pages.create.mockRejectedValueOnce(
        new Error("Failed to create page"),
      );

      await expect(
        plugin.distribute({
          input: { title: "Test Page" },
          config: {
            token: "test-token",
            databaseId: "test-database-id",
            fields: {
              title: "title",
            },
          },
        }),
      ).rejects.toThrow("Failed to create page");

      expect(console.error).toHaveBeenCalledWith(
        "Failed to create Notion page:",
        expect.any(Error),
      );
    });
  });

  describe("field filtering and type mapping", () => {
    it("should filter properties based on fields config", async () => {
      // Initialize the plugin with specific fields for this test
      await plugin.initialize({
        token: "test-token",
        databaseId: "test-database-id",
        fields: {
          title: "title",
          description: "rich_text",
          date: "date",
        },
      });

      const mockClient = plugin["client"] as any;

      await plugin.distribute({
        input: {
          title: "Test Page",
          description: "This is a test page",
          date: "2023-01-01",
          tags: ["test", "notion"],
          author: "Test User",
          url: "https://example.com",
        },
        config: {
          token: "test-token",
          databaseId: "test-database-id",
          fields: {
            title: "title",
            description: "rich_text",
            date: "date",
          },
        },
      });

      expect(mockClient.pages.create).toHaveBeenCalledTimes(1);
      const createArgs = mockClient.pages.create.mock.calls[0][0];

      // Check that only the specified fields are included
      expect(Object.keys(createArgs.properties)).toHaveLength(3);
      expect(createArgs.properties).toHaveProperty("title");
      expect(createArgs.properties).toHaveProperty("description");
      expect(createArgs.properties).toHaveProperty("date");

      // Check that other fields are not included
      expect(createArgs.properties).not.toHaveProperty("tags");
      expect(createArgs.properties).not.toHaveProperty("author");
      expect(createArgs.properties).not.toHaveProperty("url");
    });

    it("should format properties based on specified types", async () => {
      // Initialize the plugin with specific fields for this test
      await plugin.initialize({
        token: "test-token",
        databaseId: "test-database-id",
        fields: {
          title: "title",
          description: "rich_text",
          date: "date",
          count: "number",
          isPublished: "checkbox",
          tags: "multi_select",
          category: "select",
          website: "url",
          email: "email",
          phone: "phone",
        },
      });

      const mockClient = plugin["client"] as any;

      await plugin.distribute({
        input: {
          title: "Test Page",
          description: "This is a test page",
          date: "2023-01-01",
          count: "42", // String that should be converted to number
          isPublished: "true", // String that should be converted to boolean
          tags: "tag1,tag2,tag3", // String that should be converted to multi-select
          category: "Blog", // String that should be converted to select
          website: "https://example.com", // String that should be formatted as URL
          email: "test@example.com", // String that should be formatted as email
          phone: "123-456-7890", // String that should be formatted as phone
        },
        config: {
          token: "test-token",
          databaseId: "test-database-id",
          fields: {
            title: "title",
            description: "rich_text",
            date: "date",
            count: "number",
            isPublished: "checkbox",
            tags: "multi_select",
            category: "select",
            website: "url",
            email: "email",
            phone: "phone",
          },
        },
      });

      expect(mockClient.pages.create).toHaveBeenCalledTimes(1);
      const createArgs = mockClient.pages.create.mock.calls[0][0];
      const props = createArgs.properties;

      // Check title formatting
      expect(props.title.title[0].text.content).toBe("Test Page");

      // Check rich_text formatting
      expect(props.description.rich_text[0].text.content).toBe(
        "This is a test page",
      );

      // Check date formatting
      expect(props.date.date.start).toMatch(/2023-01-01/);

      // Check number formatting
      expect(props.count.number).toBe(42);

      // Check checkbox formatting
      expect(props.isPublished.checkbox).toBe(true);

      // Check multi_select formatting
      expect(props.tags.multi_select).toHaveLength(3);
      expect(props.tags.multi_select[0].name).toBe("tag1");
      expect(props.tags.multi_select[1].name).toBe("tag2");
      expect(props.tags.multi_select[2].name).toBe("tag3");

      // Check select formatting
      expect(props.category.select.name).toBe("Blog");

      // Check URL formatting
      expect(props.website.url).toBe("https://example.com");

      // Check email formatting
      expect(props.email.email).toBe("test@example.com");

      // Check phone formatting
      expect(props.phone.phone_number).toBe("123-456-7890");
    });

    it("should handle arrays correctly for multi_select", async () => {
      // Initialize the plugin with specific fields for this test
      await plugin.initialize({
        token: "test-token",
        databaseId: "test-database-id",
        fields: {
          title: "title",
          tags: "multi_select",
        },
      });

      const mockClient = plugin["client"] as any;

      await plugin.distribute({
        input: {
          title: "Test Page",
          tags: ["test", "notion", "api"],
        },
        config: {
          token: "test-token",
          databaseId: "test-database-id",
          fields: {
            title: "title",
            tags: "multi_select",
          },
        },
      });

      expect(mockClient.pages.create).toHaveBeenCalledTimes(1);
      const createArgs = mockClient.pages.create.mock.calls[0][0];
      const props = createArgs.properties;

      // Check multi_select formatting with array input
      expect(props.tags.multi_select).toHaveLength(3);
      expect(props.tags.multi_select[0].name).toBe("test");
      expect(props.tags.multi_select[1].name).toBe("notion");
      expect(props.tags.multi_select[2].name).toBe("api");
    });

    it("should handle invalid date values gracefully", async () => {
      // Initialize the plugin with specific fields for this test
      await plugin.initialize({
        token: "test-token",
        databaseId: "test-database-id",
        fields: {
          title: "title",
          date: "date",
        },
      });

      const mockClient = plugin["client"] as any;

      await plugin.distribute({
        input: {
          title: "Test Page",
          date: "not-a-date",
        },
        config: {
          token: "test-token",
          databaseId: "test-database-id",
          fields: {
            title: "title",
            date: "date",
          },
        },
      });

      expect(mockClient.pages.create).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        "Failed to parse date: not-a-date. Using current date.",
      );

      const createArgs = mockClient.pages.create.mock.calls[0][0];
      const props = createArgs.properties;

      // Check that date is still included with a fallback value
      expect(props.date.date.start).toBeDefined();
    });

    it("should correctly parse numeric timestamps passed as strings", async () => {
      // Initialize the plugin with specific fields for this test
      await plugin.initialize({
        token: "test-token",
        databaseId: "test-database-id",
        fields: {
          title: "title",
          date: "date",
        },
      });

      const mockClient = plugin["client"] as any;

      // Use a known timestamp (March 17, 2025)
      const timestamp = "1742443068774";
      const expectedDate = new Date(parseInt(timestamp, 10));

      await plugin.distribute({
        input: {
          title: "Test Page",
          date: timestamp,
        },
        config: {
          token: "test-token",
          databaseId: "test-database-id",
          fields: {
            title: "title",
            date: "date",
          },
        },
      });

      expect(mockClient.pages.create).toHaveBeenCalledTimes(1);

      const createArgs = mockClient.pages.create.mock.calls[0][0];
      const props = createArgs.properties;

      // Check that the timestamp was correctly parsed
      expect(props.date.date.start).toBe(expectedDate.toISOString());
      expect(console.warn).not.toHaveBeenCalled();
    });

    it("should handle missing title property by using the first property as title", async () => {
      // Initialize the plugin with specific fields for this test
      await plugin.initialize({
        token: "test-token",
        databaseId: "test-database-id",
        fields: {
          description: "title", // Set description as title type
          date: "date",
        },
      });

      const mockClient = plugin["client"] as any;

      await plugin.distribute({
        input: {
          description: "This is a test page without a title",
          date: "2023-01-01",
        },
        config: {
          token: "test-token",
          databaseId: "test-database-id",
          fields: {
            description: "title", // Set description as title type
            date: "date",
          },
        },
      });

      expect(mockClient.pages.create).toHaveBeenCalledTimes(1);
      const createArgs = mockClient.pages.create.mock.calls[0][0];
      const props = createArgs.properties;

      // Check that the description property is formatted as title
      expect(props.description).toBeDefined();
      expect(props.description.title).toBeDefined();
      expect(props.description.title[0].text.content).toBe(
        "This is a test page without a title",
      );
    });

    it("should handle empty input gracefully", async () => {
      // Initialize the plugin with specific fields for this test
      await plugin.initialize({
        token: "test-token",
        databaseId: "test-database-id",
        fields: {
          title: "title",
        },
      });

      const mockClient = plugin["client"] as any;

      await plugin.distribute({
        input: {},
        config: {
          token: "test-token",
          databaseId: "test-database-id",
          fields: {
            title: "title",
          },
        },
      });

      expect(mockClient.pages.create).toHaveBeenCalledTimes(1);
      const createArgs = mockClient.pages.create.mock.calls[0][0];
      const props = createArgs.properties;

      // Check that a default title is created
      expect(props.Title).toBeDefined();
      expect(props.Title.title[0].text.content).toBe("New Item");
    });
  });
});
