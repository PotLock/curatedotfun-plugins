import {
  faArrowsRotate,
  faFloppyDisk,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  distributeContent,
  formatDistributionResults,
} from "../lib/distribute";
import {
  formatTransformedContent,
  parseContent,
  transformContent,
} from "../lib/transform";
import DistributionPlugin, {
  Plugin as DistributionPluginType,
} from "@/components/plugin-config/distribution-plugins";
import TransformPlugin, {
  Plugin as TransformPluginType,
} from "@/components/plugin-config/transform-plugins";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function PluginConfig() {
  const [view, setView] = useState<"json" | "config">("config");
  const [jsonConfig, setJsonConfig] = useState<string>("{}");
  const [currentContent, setCurrentContent] = useState<string>("");
  const [originalContentSnapshot, setOriginalContentSnapshot] = useState<string | null>(null);
  const [transformPlugins, setTransformPlugins] = useState<
    TransformPluginType[]
  >([]);
  const [distributionPlugins, setDistributionPlugins] = useState<
    DistributionPluginType[]
  >([]);

  const toggleView = () => {
    try {
      if (view === "config") {
        const config = {
          transform: transformPlugins,
          distribution: distributionPlugins,
        };
        setJsonConfig(JSON.stringify(config, null, 2));
      } else {
        const config = JSON.parse(jsonConfig);
        setTransformPlugins(config.transform || []);
        setDistributionPlugins(config.distribution || []);
      }
      setView(view === "json" ? "config" : "json");
    } catch (error: unknown) {
      toast.error(
        `Invalid JSON configuration: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      console.error("Error toggling view:", error);
    }
  };

  const handleSave = () => {
    try {
      const config =
        view === "json"
          ? JSON.parse(jsonConfig)
          : {
              transform: transformPlugins,
              distribution: distributionPlugins,
            };
      localStorage.setItem("pluginConfig", JSON.stringify(config));
      toast.success("Configuration saved successfully!");
    } catch (error: unknown) {
      toast.error(
        `Error saving configuration: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      console.error("Error saving configuration:", error);
    }
  };

  const reset = () => {
    setJsonConfig("{}");
    setCurrentContent("");
    setOriginalContentSnapshot(null);
    setTransformPlugins([]);
    setDistributionPlugins([]);
    toast.success("Configuration reset successfully!");
  };

  const handleTransform = async () => {
    try {
      if (transformPlugins.length === 0) {
        toast.error("No transform plugins configured");
        return;
      }

      if (!currentContent.trim()) {
        toast.error("Cannot transform empty content");
        return;
      }
      
      setOriginalContentSnapshot(currentContent); // Snapshot before transforming

      let contentToProcess = parseContent(currentContent);
      let lastSuccessfulContent = currentContent; // Keep track of last raw string content

      for (const pluginConfig of transformPlugins) {
        if (!pluginConfig.type) {
          toast.error("A transform plugin is missing its type. Skipping.");
          continue;
        }
        try {
          const apiPluginPayload = {
            plugin: pluginConfig.type,
            config: JSON.parse(pluginConfig.content || "{}"),
          };
          
          // transformContent expects an array of plugins, so wrap the current one
          const result = await transformContent([apiPluginPayload], contentToProcess);
          contentToProcess = result; // The result from API is already parsed (unknown type)
          lastSuccessfulContent = formatTransformedContent(result); // Update for next iteration's potential string input
          setCurrentContent(lastSuccessfulContent); // Update UI progressively
          toast.success(`Plugin ${pluginConfig.type} applied.`);
        } catch (pluginError) {
          toast.error(
            `Error applying plugin ${pluginConfig.type}: ${
              pluginError instanceof Error ? pluginError.message : "Unknown error"
            }. Stopping transformations.`,
          );
          // Revert to content before this failing plugin
          setCurrentContent(formatTransformedContent(parseContent(lastSuccessfulContent)));
          throw pluginError; // Or handle more gracefully, e.g., allow continuing with next
        }
      }
      // Final content is already in setCurrentContent due to progressive updates
      toast.success("All transformations completed successfully!");
    } catch (error: unknown) {
      // Catch errors from the loop or initial checks
      // Specific plugin errors are toasted inside the loop
      if (!(error instanceof Error && error.message.includes("Error applying plugin"))) {
         toast.error(
           `Transform failed: ${error instanceof Error ? error.message : "Unknown error"}`,
         );
      }
    }
  };

  const handleDistribute = async () => {
    try {
      if (distributionPlugins.length === 0) {
        toast.error("No distribution plugins configured");
        return;
      }

      if (!currentContent.trim()) {
        toast.error("Cannot distribute empty content");
        return;
      }

      const parsedContentForDistribution = parseContent(currentContent);

      // Map distribution plugins to the format expected by the API
      const plugins = distributionPlugins.map((plugin) => {
        if (!plugin.type) {
          throw new Error("A distribution plugin is missing its type.");
        }
        return {
          plugin: plugin.type,
          config: JSON.parse(plugin.content || "{}"),
        };
      });

      // Call the API to distribute the content
      const results = await distributeContent(plugins, parsedContentForDistribution);
      const formattedResults = formatDistributionResults(results);

      if (results.length === 0) {
        toast.success("Distribution attempt completed. No results from plugins.");
      } else {
        const allSucceeded = results.every(r => r.success);
        if (allSucceeded) {
          toast.success(`All distributions successful:\n${formattedResults}`);
        } else {
          // Some or all individual plugin distributions failed
          toast.error(`Distribution attempt had failures:\n${formattedResults}`);
        }
      }
    } catch (error: unknown) {
      // This catch is for errors during setup (e.g., JSON.parse in map, missing type)
      // or if distributeContent itself throws (e.g., network error, API 500)
      toast.error(
        `Distribution operation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  return (
    <div className="flex flex-col md:flex-row py-8 px-16 min-h-screen relative gap-14">
      <div className="flex flex-col flex-1 gap-5 md:sticky top-0 h-fit max-h-screen py-10">
        <div className="flex flex-col gap-5">
          <h1 className="text-3xl">Content</h1>
          <p>Enter your content below and use transform to modify it.</p>
          <Textarea
            placeholder="Enter your content..."
            className="h-44"
            value={currentContent}
            onChange={(e) => {
              setCurrentContent(e.target.value);
              if (originalContentSnapshot !== null) {
                setOriginalContentSnapshot(null); // Clear snapshot if user edits main content
              }
            }}
          />
          {originalContentSnapshot && (
            <div className="mt-4">
              <h2 className="text-lg font-medium mb-2">Original Content (Snapshot):</h2>
              <div className="p-4 border rounded-md bg-gray-100 dark:bg-gray-800 whitespace-pre-wrap text-sm">
                {originalContentSnapshot}
              </div>
            </div>
          )}
        </div>
      </div>

      <div id="config-panel" className="flex flex-col gap-5 flex-1 w-full">
        <h1 className="text-3xl">Plugin Configuration</h1>
        <div className="flex items-center justify-start mt-5 gap-2">
          <Button variant="outline" onClick={toggleView} className="group">
            <FontAwesomeIcon
              icon={faArrowsRotate}
              className="h-5 w-5 transition-transform duration-200 group-hover:rotate-90"
            />
            <span>Switch to {view === "json" ? "Config" : "JSON"} View</span>
          </Button>
          <Button variant="outline" onClick={handleSave} className="group">
            <FontAwesomeIcon
              icon={faFloppyDisk}
              className="h-5 w-5 transition-transform duration-200 group-hover:scale-110"
            />
            <span>Save Configuration</span>
          </Button>
          <Button
            variant="outline"
            onClick={reset}
            className="group bg-transparent transition-all duration-200 hover:shadow-red-500/30 hover:shadow-xl hover:bg-red-500/10 hover:border-red-500/0"
          >
            <FontAwesomeIcon
              icon={faRotateLeft}
              className="h-5 w-5 transition-transform duration-200 group-hover:scale-110"
            />
            <span>Reset</span>
          </Button>
        </div>
        {view === "json" ? (
          <Textarea
            className="w-full h-96 p-4 border border-neutral-300 rounded-lg"
            placeholder="Enter your plugin JSON here..."
            value={jsonConfig}
            onChange={(e) => setJsonConfig(e.target.value)}
          />
        ) : (
          <>
            <TransformPlugin
              plugins={transformPlugins}
              onPluginsChange={setTransformPlugins}
            />
            <DistributionPlugin
              plugins={distributionPlugins}
              onPluginsChange={setDistributionPlugins}
            />
          </>
        )}
        <div className="flex items-center justify-end gap-5">
          <Button variant="outline" onClick={handleTransform}>
            Transform Content
          </Button>
          <Button onClick={handleDistribute}>Distribute</Button>
        </div>
      </div>
    </div>
  );
}
