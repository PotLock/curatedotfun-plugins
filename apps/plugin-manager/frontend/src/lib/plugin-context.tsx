import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { fetchPluginRegistry, PluginRegistry } from "./registry";
import toast from "react-hot-toast";

// Define the context type
interface PluginContextType {
  registry: PluginRegistry;
  availablePlugins: {
    transformer: string[];
    distributor: string[];
  };
  pluginDefaults: Record<string, Record<string, unknown>>;
  loading: boolean;
  error: string | null;
  refreshRegistry: () => Promise<void>;
}

// Default plugin configurations
export const PLUGIN_DEFAULTS: Record<string, Record<string, unknown>> = {
  "@curatedotfun/ai-transform": {
    prompt: "Transform this into an engaging social media post",
    apiKey: "{OPENROUTER_API_KEY}",
    schema: {
      title: {
        type: "string",
        description: "Title derived from summary of content",
      },
      content: {
        type: "string",
        description: "Engaging social media post",
      },
    },
  },
  "@curatedotfun/object-transform": {
    mappings: {
      title: "Title: {{title}}",
      content: "Generated Content: {{content}}",
      tags: ["automated", "content"],
    },
  },
  "@curatedotfun/simple-transform": {
    format: "🚀 {{title}} \n\n {{content}} \n\n#{{#tags}}#{{.}}{{/tags}}",
  },
  "@curatedotfun/translate-transform": {
    apiKey: "{DEEPL_API_KEY}",
    targetLang: "JA",
    sourceLang: "EN",
    preserveFormatting: true,
  },
  "@curatedotfun/notion": {
    token: "{NOTION_TOKEN}",
    databaseId: "your-database-id",
  },
  "@curatedotfun/telegram": {
    botToken: "{TELEGRAM_BOT_TOKEN}",
    channelId: "@your_channel",
  },
  "@curatedotfun/rss": {
    serviceUrl: "http://localhost:4001",
    apiSecret: "{API_SECRET}",
  },
  "@curatedotfun/supabase": {
    url: "{SUPABASE_URL}",
    key: "{SUPABASE_KEY}",
    table: "your-table-name",
  },
  "@curatedotfun/near-social": {
    accountId: "{NEAR_ACCOUNT_ID}",
    privateKey: "{NEAR_PRIVATE_KEY}",
    networkId: "testnet",
  },
  "@curatedotfun/crosspost": {
    keyPair: "{CROSSPOST_KEY}",
    targets: [{ platform: "your-platform", userId: "your-userid" }],
  },
  "@curatedotfun/discord": {
    botToken: "{DISCORD_BOT_TOKEN}",
    channelId: "123456789012345678",
  },
  "@curatedotfun/farcaster": {
    apiKey: "{FARCASTER_API_KEY}",
    signerUuid: "{FARCASTER_SIGNER_UUID}",
  },
};

// Create the context with default values
const PluginContext = createContext<PluginContextType>({
  registry: {},
  availablePlugins: {
    transformer: [],
    distributor: [],
  },
  pluginDefaults: PLUGIN_DEFAULTS,
  loading: true,
  error: null,
  refreshRegistry: async () => {},
});

// Provider component
export function PluginProvider({ children }: { children: ReactNode }) {
  const [registry, setRegistry] = useState<PluginRegistry>({});
  const [availablePlugins, setAvailablePlugins] = useState<{
    transformer: string[];
    distributor: string[];
  }>({
    transformer: [],
    distributor: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to load the registry
  const loadRegistry = async () => {
    try {
      setLoading(true);
      setError(null);

      const registryData = await fetchPluginRegistry();
      setRegistry(registryData);

      // Update available plugins
      const transformers = Object.entries(registryData)
        .filter(([, metadata]) => metadata.type === "transformer")
        .map(([name]) => name);

      const distributors = Object.entries(registryData)
        .filter(([, metadata]) => metadata.type === "distributor")
        .map(([name]) => name);

      setAvailablePlugins({
        transformer: transformers,
        distributor: distributors,
      });

      toast.success("Plugin registry loaded successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(errorMessage);
      toast.error(`Failed to load plugin registry: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Load registry on mount
  useEffect(() => {
    loadRegistry();
  }, []);

  return (
    <PluginContext.Provider
      value={{
        registry,
        availablePlugins,
        pluginDefaults: PLUGIN_DEFAULTS,
        loading,
        error,
        refreshRegistry: loadRegistry,
      }}
    >
      {children}
    </PluginContext.Provider>
  );
}

// Hook to use the plugin context
export function usePluginContext() {
  return useContext(PluginContext);
}
