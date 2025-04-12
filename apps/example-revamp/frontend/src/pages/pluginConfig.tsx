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
  const [content, setContent] = useState<string>("");
  const [transformedContent, setTransformedContent] = useState<string>("");
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
    setContent("");
    setTransformedContent("");
    setTransformPlugins([]);
    setDistributionPlugins([]);
    toast.success("Configuration reset successfully!");
  };

  const handleTransform = async () => {
    try {
      if (transformPlugins.length === 0)
        throw new Error("No transform plugins configured");

      // Map transform plugins to the format expected by the API
      const plugins = transformPlugins.map((plugin) => ({
        plugin: plugin.type,
        config: JSON.parse(plugin.content),
      }));

      // Parse the content
      if (!content.trim()) {
        toast.error("Cannot transform empty content");
        return;
      }
      const parsedContent = parseContent(content);

      // Call the API to transform the content
      const result = await transformContent(plugins, parsedContent);

      // Format the transformed content for display
      const formattedContent = formatTransformedContent(result);

      // Update the state
      setTransformedContent(formattedContent);
      toast.success("Transform completed successfully!");
    } catch (error: unknown) {
      toast.error(
        `Transform failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleDistribute = async () => {
    try {
      if (distributionPlugins.length === 0)
        throw new Error("No distribution plugins configured");

      // Map distribution plugins to the format expected by the API
      const plugins = distributionPlugins.map((plugin) => ({
        plugin: plugin.type,
        config: JSON.parse(plugin.content),
      }));

      // Parse the content if needed
      const parsedContent = transformedContent
        ? parseContent(transformedContent)
        : {};

      // Call the API to distribute the content
      const results = await distributeContent(plugins, parsedContent);

      // Format the results for display
      const formattedResults = formatDistributionResults(results);

      // Show the results
      toast.success(
        `Distribution completed successfully!\n${formattedResults}`,
      );
    } catch (error: unknown) {
      toast.error(
        `Distribution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
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
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {transformedContent && (
            <div className="mt-4 p-4 border rounded-md bg-gray-50 whitespace-pre-wrap">
              <h2 className="text-lg font-medium">Transformed Content:</h2>
              {transformedContent}
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
