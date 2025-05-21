import { z } from "zod";
import {
  SourcePlugin,
  SourcePluginSearchOptions,
  SourcePluginSearchResults,
  LastProcessedState,
  IPlatformSearchService,
  PlatformState,
} from "@curatedotfun/types";
import { MasaClient, MasaClientConfig, MasaSearchResult } from "./masa-client";
import { serviceRegistry, PlatformConfig } from "./services";

const MasaSourcePluginConfigSchema = z.object({
  apiKey: z.string().min(1, "Masa API key is required"),
  baseUrl: z.string().url().optional(),
});

export type MasaSourcePluginConfig = z.infer<
  typeof MasaSourcePluginConfigSchema
>;

export class MasaSourcePlugin
  implements
    SourcePlugin<MasaSearchResult, MasaSourcePluginConfig, PlatformState>
{
  public readonly type: "source" = "source";
  public readonly name: string = "@curatedotfun/masa-source";
  public readonly version: string = "0.1.1";
  public readonly description: string =
    "Fetches social media data using the Masa API with service-based architecture.";

  private masaClient!: MasaClient;
  private config!: MasaSourcePluginConfig;
  // Services map now uses the generic PlatformState
  private services: Map<
    string,
    IPlatformSearchService<any, any, PlatformState>
  > = new Map();
  private platformConfigs: Map<string, PlatformConfig<any, any>> = new Map();

  async initialize(config?: MasaSourcePluginConfig): Promise<void> {
    if (!config) {
      throw new Error("MasaSourcePlugin configuration is required.");
    }
    const validatedConfig = MasaSourcePluginConfigSchema.parse(config);
    this.config = validatedConfig;

    const clientConfig: MasaClientConfig = {
      apiKey: this.config.apiKey,
      baseUrl: this.config.baseUrl,
    };
    this.masaClient = new MasaClient(clientConfig);

    // Register services and their configs from the registry
    for (const entry of serviceRegistry) {
      const serviceInstance = entry.factory(this.masaClient);
      this.services.set(entry.platformType, serviceInstance);
      this.platformConfigs.set(entry.platformType, entry.config);
    }

    console.log(
      "MasaSourcePlugin initialized with registered services:",
      Array.from(this.services.keys()),
    );
    console.log(
      "MasaSourcePlugin loaded platform configs for:",
      Array.from(this.platformConfigs.keys()),
    );
  }

  async shutdown(): Promise<void> {
    console.log("MasaSourcePlugin shutting down...");
    for (const service of this.services.values()) {
      if (typeof service.shutdown === "function") {
        try {
          await service.shutdown();
        } catch (error) {
          console.error(`Error shutting down service:`, error);
        }
      }
    }
    console.log("MasaSourcePlugin shutdown complete.");
  }

  async search(
    lastProcessedState: LastProcessedState<PlatformState> | null,
    options: SourcePluginSearchOptions,
  ): Promise<SourcePluginSearchResults<MasaSearchResult, PlatformState>> {
    if (!this.masaClient) {
      throw new Error(
        "MasaSourcePlugin not initialized. Call initialize first.",
      );
    }

    const { type: searchPlatformType, ...remainingOptions } = options; // query, pageSize, etc. are in remainingOptions

    console.log(
      `MasaSourcePlugin: search dispatching for type "${searchPlatformType}", options:`,
      remainingOptions,
    );
    if (lastProcessedState) {
      console.log(
        "MasaSourcePlugin: lastProcessedState:",
        JSON.stringify(lastProcessedState, null, 2),
      );
    }

    const service = this.services.get(searchPlatformType);
    if (!service) {
      throw new Error(
        `No service registered for platform type: "${searchPlatformType}"`,
      );
    }

    const platformConfig = this.platformConfigs.get(searchPlatformType);
    if (!platformConfig) {
      throw new Error(
        `No platform configuration found for type: "${searchPlatformType}"`,
      );
    }

    let items: MasaSearchResult[] = [];
    let nextPluginStateData: PlatformState | null = null;

    try {
      // Prepare and validate platform-specific arguments
      const rawServiceOptions = platformConfig.preparePlatformArgs(options);
      const validatedServiceOptions =
        platformConfig.optionsSchema.parse(rawServiceOptions);

      const serviceResults = await service.search(
        validatedServiceOptions,
        lastProcessedState, // Pass the generic LastProcessedState<PlatformState>
      );

      items = serviceResults.items as MasaSearchResult[];
      nextPluginStateData = serviceResults.nextStateData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(
          `MasaSourcePlugin: Options validation failed for "${searchPlatformType}":`,
          error.errors,
        );
        throw new Error(
          `Invalid options for ${searchPlatformType}: ${error.errors.map((e) => `${e.path.join(".")} - ${e.message}`).join(", ")}`,
        );
      }
      console.error(
        `MasaSourcePlugin: Error during search for "${searchPlatformType}":`,
        error,
      );
      throw error;
    }

    // Construct the next LastProcessedState for the plugin consumer
    let nextLPS: LastProcessedState<PlatformState> | null = null;
    if (nextPluginStateData) {
      nextLPS = {
        data: nextPluginStateData, // This is the TPlatformState from the service
      };
    }

    console.log(
      `MasaSourcePlugin: Search for "${searchPlatformType}" returned ${items.length} items.`,
    );
    if (nextLPS) {
      console.log(
        `MasaSourcePlugin: Next LastProcessedState:`,
        JSON.stringify(nextLPS, null, 2),
      );
    }

    return {
      items,
      nextLastProcessedState: nextLPS,
    };
  }
}

export default MasaSourcePlugin;
