import { RefreshCw, Save, Undo2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { distributeContent, formatDistributionResults } from "../lib/distribute";
import { usePluginContext } from "../lib/plugin-context";
import { updatePluginRegistry } from "../lib/registry";
import { formatTransformedContent, parseContent, transformContent } from "../lib/transform";
import DistributionPlugin, { Plugin as DistributionPluginType } from "./plugin-config/distribution-plugins";
import PluginRegistry from "./plugin-config/plugin-registry";
import TransformPlugin, { Plugin as TransformPluginType } from "./plugin-config/transform-plugins";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

export default function PluginConfig() {
  const { refreshRegistry } = usePluginContext();
  const [view, setView] = useState<"json" | "config">("config");
  const [jsonConfig, setJsonConfig] = useState<string>("{}");
  const [content, setContent] = useState<string>("");
  const [transformedContent, setTransformedContent] = useState<string>("");
  const [transformPlugins, setTransformPlugins] = useState<TransformPluginType[]>([]);
  const [distributionPlugins, setDistributionPlugins] = useState<DistributionPluginType[]>([]);

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
    } catch {
      toast.error("Invalid JSON configuration");
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
    } catch {
      toast.error("Error saving configuration");
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
      const plugins = transformPlugins.map(plugin => ({
        plugin: plugin.type,
        config: JSON.parse(plugin.content)
      }));
      
      // Parse the content
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
      const plugins = distributionPlugins.map(plugin => ({
        plugin: plugin.type,
        config: JSON.parse(plugin.content)
      }));
      
      // Parse the content if needed
      const parsedContent = transformedContent ? parseContent(transformedContent) : {};
      
      // Call the API to distribute the content
      const results = await distributeContent(plugins, parsedContent);
      
      // Format the results for display
      const formattedResults = formatDistributionResults(results);
      
      // Show the results
      toast.success(`Distribution completed successfully!\n${formattedResults}`);
    } catch (error: unknown) {
      toast.error(
        `Distribution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleRegistrySave = async (registryData: string) => {
    try {
      if (!registryData.trim()) {
        throw new Error('Registry data is empty');
      }
      
      // Parse the registry data
      const registry = JSON.parse(registryData);
      
      // Update the registry on the server
      await updatePluginRegistry(registry);
      
      // Refresh the registry in the context
      await refreshRegistry();
      
      toast.success("Registry updated successfully!");
    } catch (error) {
      toast.error(
        `Failed to update registry: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  return (
    <div className="flex flex-col md:flex-row py-8 px-16 min-h-screen relative gap-14">
      <div id="config-panel" className="flex flex-col gap-5 flex-1 w-full">
        <h1 className="text-3xl">Plugin Configuration</h1>
        <div className="flex items-center justify-start mt-5 gap-2">
          <Button variant="outline" onClick={toggleView} className="group">
            <RefreshCw className="h-5 w-5 transition-transform duration-200 group-hover:rotate-90" />
            <span>Switch to {view === "json" ? "Config" : "JSON"} View</span>
          </Button>
          <Button variant="outline" onClick={handleSave} className="group">
            <Save className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
            <span>Save Configuration</span>
          </Button>
          <Button
            variant="outline"
            onClick={reset}
            className="group bg-transparent transition-all duration-200 hover:shadow-red-500/30 hover:shadow-xl hover:bg-red-500/10 hover:border-red-500/0"
          >
            <Undo2 className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
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
        <PluginRegistry handleRegistrySave={handleRegistrySave} />
      </div>

      <div className="flex flex-col flex-1 gap-5 md:sticky top-0 h-fit max-h-screen py-10">
        <div className="flex flex-col gap-5">
          <h1 className="text-3xl">Content</h1>
          <p>Enter your content below and use transform to modify it.</p>
          <Textarea
            placeholder="Enter your content..."
            className="h-24"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {transformedContent && (
            <div className="mt-4 p-4 border rounded-md bg-gray-50 whitespace-pre-wrap">
              <h2 className="text-lg font-medium">Transformed Content:</h2>
              {transformedContent}
            </div>
          )}
          <Button variant="outline" onClick={handleTransform}>
            Transform Content
          </Button>
        </div>
        <div className="flex flex-col gap-5">
          <h1 className="text-3xl">Distribution</h1>
          <p>
            Click the button below to distribute the transformed content using
            the configured plugins.
          </p>
          <Button variant="outline" onClick={handleDistribute}>
            Distribute
          </Button>
        </div>
      </div>
    </div>
  );
}
