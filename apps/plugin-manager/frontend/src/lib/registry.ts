/**
 * Plugin registry operations
 */
import { get, post } from "./api";

// Define types for the registry
export interface PluginMetadata {
  type: string;
  name: string;
  description: string;
  version: string;
  [key: string]: unknown;
}

export interface PluginRegistry {
  [pluginName: string]: PluginMetadata;
}

export interface RegistryResponse {
  registry: PluginRegistry;
}

/**
 * Fetch the plugin registry from the backend
 */
export async function fetchPluginRegistry(): Promise<PluginRegistry> {
  try {
    const { registry } = await get<RegistryResponse>("/plugin-registry");
    return registry;
  } catch (error) {
    console.error("Failed to fetch plugin registry:", error);
    throw error;
  }
}

/**
 * Update the plugin registry on the backend
 */
export async function updatePluginRegistry(
  registry: PluginRegistry,
): Promise<PluginRegistry> {
  try {
    const response = await post<RegistryResponse>("/plugin-registry", {
      registry,
    });
    return response.registry;
  } catch (error) {
    console.error("Failed to update plugin registry:", error);
    throw error;
  }
}

/**
 * Get available plugins by type
 */
export function getAvailablePluginsByType(registry: PluginRegistry): {
  transformer: string[];
  distributor: string[];
} {
  const result = {
    transformer: [] as string[],
    distributor: [] as string[],
  };

  Object.entries(registry).forEach(([name, metadata]) => {
    if (metadata.type === "transformer") {
      result.transformer.push(name);
    } else if (metadata.type === "distributor") {
      result.distributor.push(name);
    }
  });

  return result;
}
