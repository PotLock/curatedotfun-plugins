import {
  DistributorPlugin,
  LastProcessedState,
  PlatformState,
  SourcePluginSearchOptions,
} from "@curatedotfun/types";
import "dotenv/config";
import express from "express";
import { merge } from "lodash";
import path from "path";
import { PluginService } from "./plugin-service";
import {
  getPluginByName,
  getPluginRegistry,
  setPluginRegistry,
} from "./plugin-service/plugin-registry";
import { hydrateConfigValues } from "./utils";

async function main() {
  const app = express();
  const pluginService = new PluginService(getPluginByName);

  // Serve static frontend files
  app.use(express.static(path.join(__dirname, "./public")));
  app.use(express.json());

  // Distribution endpoint
  app.post("/api/distribute", async (req, res) => {
    try {
      const config = req.body;

      if (!config.distribute || !Array.isArray(config.distribute)) {
        throw new Error(
          "Invalid configuration: missing or invalid distribute array",
        );
      }

      // Load and configure plugins
      const loadedPlugins: DistributorPlugin[] = [];

      for (const pluginConfig of config.distribute) {
        console.log("pluginConfig.plugin", pluginConfig.plugin);

        try {
          // Hydrate config with environment variables
          const hydratedConfig = hydrateConfigValues(pluginConfig.config);

          const plugin = await pluginService.getPlugin<"distributor">(
            pluginConfig.plugin,
            {
              type: "distributor",
              config: hydratedConfig,
            },
          );

          loadedPlugins.push(plugin);
          console.log(`Loaded plugin: ${pluginConfig.plugin}`);
        } catch (error) {
          console.error(`Failed to load plugin ${pluginConfig.plugin}:`, error);
          throw new Error(`Failed to load plugin ${pluginConfig.plugin}`);
        }
      }

      // Get content from request
      const { content } = req.body;
      if (!content) {
        throw new Error("No content provided for distribution");
      }

      // Distribute to all loaded plugins
      const results = await Promise.all(
        loadedPlugins.map(async (plugin, index) => {
          const pluginName = config.distribute[index].plugin;
          try {
            await plugin.distribute({ input: content });
            return { plugin: pluginName, status: "success" };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            console.error(
              `Distribution failed for plugin ${pluginName}:`,
              error,
            );
            return { plugin: pluginName, status: "error", error: errorMessage };
          }
        }),
      );

      res.json({ success: true, results });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Distribution failed";
      console.error("Error in distribution:", error);
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * Combines transform results, merging objects or returning the new result
   */
  function combineResults(prevResult: unknown, newResult: unknown): unknown {
    // If both are objects (not arrays), merge them with new values taking precedence
    if (
      typeof prevResult === "object" &&
      prevResult !== null &&
      !Array.isArray(prevResult) &&
      typeof newResult === "object" &&
      newResult !== null &&
      !Array.isArray(newResult)
    ) {
      return merge({}, prevResult, newResult);
    }

    // Otherwise return the new result (string will just return)
    return newResult;
  }

  /**
   * Apply a series of transformations to content
   */
  async function applyTransforms(
    content: any,
    transforms: Array<{ plugin: string; config: any }> = [],
    stage: string = "global",
  ) {
    let result = content;

    for (let i = 0; i < transforms.length; i++) {
      const transform = transforms[i];
      try {
        // Hydrate config with environment variables
        const hydratedConfig = hydrateConfigValues(transform.config);

        // Load and configure transform plugin
        const plugin = await pluginService.getPlugin<"transformer">(
          transform.plugin,
          {
            type: "transformer",
            config: hydratedConfig,
          },
        );

        console.log(
          `Applying ${stage} transform #${i + 1} (${transform.plugin})`,
        );
        const transformResult = await plugin.transform({
          input: result,
          config: hydratedConfig,
        });

        // Validate transform output
        if (transformResult === undefined || transformResult === null) {
          throw new Error(
            `Transform ${transform.plugin} returned null or undefined`,
          );
        }

        // Combine results, either merging objects or using new result
        result = combineResults(result, transformResult);
      } catch (error) {
        console.error(`Transform error (${transform.plugin}):`, error);
        throw new Error(
          `Transform failed at ${stage} stage, plugin ${transform.plugin}, index ${i}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
      }
    }

    return result;
  }

  // Transform endpoint
  app.post("/api/transform", async (req, res) => {
    try {
      const { transform, content } = req.body;

      if (!content) {
        throw new Error("No content provided for transformation");
      }

      if (!Array.isArray(transform) || transform.length === 0) {
        throw new Error("No transforms specified");
      }

      // Apply all transforms in sequence
      const result = await applyTransforms(content, transform);
      res.json({ success: true, output: result });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Transform failed";
      console.error("Error in transform:", error);
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  // Source Query endpoint
  app.post("/api/source/query", async (req, res) => {
    try {
      const {
        pluginName,
        options,
        config: pluginInitConfig,
        lastProcessedState,
      } = req.body as {
        pluginName: string;
        options: SourcePluginSearchOptions;
        config: Record<string, any>;
        lastProcessedState?: LastProcessedState<PlatformState>;
      };

      if (!pluginName) {
        throw new Error("Missing pluginName in request body");
      }
      if (!options) {
        throw new Error("Missing options in request body");
      }
      if (!options.type || !options.query) {
        throw new Error("Invalid options: type and query are required");
      }

      // Hydrate plugin initialization config with environment variables
      const hydratedConfig = hydrateConfigValues(pluginInitConfig || {});

      // Load and configure source plugin
      const plugin = await pluginService.getPlugin<
        "source",
        SourcePluginSearchOptions,
        any,
        Record<string, any>
      >(pluginName, {
        type: "source",
        config: hydratedConfig,
      });

      console.log(
        `Querying source plugin: ${pluginName} with options:`,
        options,
        "and lastProcessedState:",
        lastProcessedState,
      );
      // Pass lastProcessedState to the search method
      const searchResult = await plugin.search(
        lastProcessedState || null,
        options,
      );

      res.json({ success: true, output: searchResult });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Source query failed";
      console.error("Error in source query:", error);
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  // Plugin registry endpoints
  app.get("/api/plugin-registry", (req, res) => {
    try {
      const registry = getPluginRegistry();
      res.json({ success: true, registry });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to get plugin registry";
      console.error("Error getting plugin registry:", error);
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  app.post("/api/plugin-registry", (req, res) => {
    try {
      const newRegistry = req.body.registry;
      if (!newRegistry || typeof newRegistry !== "object") {
        throw new Error("Invalid registry format");
      }

      setPluginRegistry(newRegistry);
      res.json({ success: true });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update plugin registry";
      console.error("Error updating plugin registry:", error);
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  // Plugin reload endpoint
  app.post("/api/plugins/reload", async (req, res) => {
    try {
      await pluginService.reloadAllPlugins();
      res.json({ success: true, message: "Plugins reloaded successfully." });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to reload plugins";
      console.error("Error reloading plugins:", error);
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  // Start server
  const port = 4000;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });

  // Cleanup plugins on exit
  process.on("SIGINT", async () => {
    await pluginService.cleanup();
    process.exit(0);
  });
}

// Run the server
main().catch(console.error);
