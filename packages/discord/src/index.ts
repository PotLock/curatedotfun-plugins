import type { ActionArgs, DistributorPlugin } from "@curatedotfun/types";
import { Client, TextChannel, GatewayIntentBits } from "discord.js";

interface DiscordConfig {
  botToken: string;
  channelId: string;
  [key: string]: string | undefined;
}

export default class DiscordPlugin
  implements DistributorPlugin<string, DiscordConfig>
{
  readonly type = "distributor" as const;
  private client: Client | null = null;
  private channelId: string | null = null;
  private botToken: string | null = null;

  async initialize(config?: DiscordConfig): Promise<void> {
    if (!config) {
      throw new Error("Discord plugin requires configuration.");
    }

    // Validate required config
    if (!config.botToken) {
      throw new Error("Discord plugin requires botToken");
    }
    if (!config.channelId) {
      throw new Error("Discord plugin requires channelId");
    }

    this.botToken = config.botToken;
    this.channelId = config.channelId;
    console.log("config", config);
    try {
      // Initialize Discord client

      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent, // Needed to read message content
        ],
      });

      // Login to Discord
      await this.client.login(this.botToken);
      // Validate channel access
      const channel = await this.client.channels.fetch(this.channelId);
      if (!channel || !(channel instanceof TextChannel)) {
        throw new Error("Invalid channel ID or insufficient permissions");
      }
    } catch (error) {
      console.error("Failed to initialize Discord plugin:", error);
      throw error;
    }
  }

  async distribute({
    input: content,
  }: ActionArgs<string, DiscordConfig>): Promise<void> {
    if (!this.client || !this.channelId) {
      throw new Error("Discord plugin not initialized");
    }

    try {
      const channel = await this.client.channels.fetch(this.channelId);
      if (!channel || !(channel instanceof TextChannel)) {
        throw new Error("Invalid channel ID or insufficient permissions");
      }

      await channel.send(content);
    } catch (error) {
      console.error("Failed to send message to Discord:", error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    if (this.client) {
      try {
        await this.client.destroy();
      } catch (error) {
        console.error("Error during Discord cleanup:", error);
      }
    }
  }
}
