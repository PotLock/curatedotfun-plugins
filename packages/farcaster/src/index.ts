import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import type { DistributorPlugin, ActionArgs } from "@curatedotfun/types";

interface FarcasterConfig extends Record<string, unknown> {
  apiKey: string;
  signerUuid: string;
}

export class FarcasterPlugin
  implements DistributorPlugin<{ content: string }, FarcasterConfig>
{
  readonly type = "distributor" as const;
  private client!: NeynarAPIClient;
  private config!: FarcasterConfig;

  constructor() {
    // Initialize without config, will be set in initialize()
  }

  async initialize(config?: FarcasterConfig): Promise<void> {
    if (!config?.apiKey) {
      throw new Error("Neynar API key is required");
    }
    if (!config?.signerUuid) {
      throw new Error("Signer UUID is required");
    }

    this.config = config;
    this.client = new NeynarAPIClient({
      apiKey: this.config.apiKey,
    });
  }

  async distribute({
    input,
  }: ActionArgs<{ content: string }, FarcasterConfig>): Promise<void> {
    if (!input) {
      throw new Error("Input is required");
    }

    try {
      await this.client.publishCast({
        signerUuid: this.config.signerUuid,
        text: input.content,
      });
    } catch (error) {
      console.error("Error posting to Farcaster:", error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    // No cleanup needed
  }
}

export default FarcasterPlugin;
