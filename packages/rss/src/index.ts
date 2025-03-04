import type {
  DistributorPlugin,
  ActionArgs,
} from "@curatedotfun/types";
import { RssService } from "./rss.service";
import { RssItem, RssConfig } from "./types";

export default class RssPlugin implements DistributorPlugin<string, RssConfig> {
  readonly type = "distributor" as const;
  private service?: RssService;

  constructor() {
    // No initialization needed
  }

  async initialize(config?: RssConfig): Promise<void> {
    if (!config) {
      throw new Error("RSS plugin requires configuration");
    }
    if (!config.title) {
      throw new Error("RSS plugin requires title");
    }
    if (!config.feedId) {
      throw new Error("RSS plugin requires feedId");
    }
    if (!config.serviceUrl) {
      throw new Error("RSS plugin requires serviceUrl");
    }

    const maxItems = config.maxItems ? parseInt(config.maxItems) : 100;

    // Create a new RSS service for this feed with enhanced configuration
    this.service = new RssService(
      config.feedId,
      config.title,
      maxItems,
      {
        serviceUrl: config.serviceUrl,
        jwtToken: config.jwtToken,
        description: config.description,
        link: config.link,
        language: config.language,
        copyright: config.copyright,
        favicon: config.favicon
      }
    );

    // Initialize the service (creates the feed on the RSS service if needed)
    await this.service.initialize();
  }

  async distribute({
    input: content,
    config,
  }: ActionArgs<string, RssConfig>): Promise<void> {
    if (!this.service) {
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
    await this.service.saveItem(item);
  }

  async shutdown(): Promise<void> {
    // No cleanup needed
  }
}
