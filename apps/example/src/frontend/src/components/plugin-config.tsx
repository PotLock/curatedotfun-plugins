import { RefreshCw, Save, Undo2 } from "lucide-react";
import { Button } from "./ui/button";
import { useRef, useState } from "react";
import TransformPlugin, {
  TransformPluginRef,
} from "./plugin-config/transform-plugins";
import DistributionPlugin, {
  DistributionPluginRef,
} from "./plugin-config/distribution-plugins";
import toast from "react-hot-toast";
import { Textarea } from "./ui/textarea";
import PluginRegistry from "./plugin-config/plugin-registry";

export default function PluginConfig() {
  const [view, setView] = useState<"json" | "config">("config");
  const [jsonConfig, setJsonConfig] = useState<string>("{}");
  const [content, setContent] = useState<string>("");
  const [transformedContent, setTransformedContent] = useState<string>("");

  // Properly typed refs
  const transformPluginRef = useRef<TransformPluginRef | null>(null);
  const distributionPluginRef = useRef<DistributionPluginRef | null>(null);

  const toggleView = () => {
    try {
      if (view === "config") {
        const config = {
          transform: transformPluginRef.current?.getPlugins() || [],
          distribution: distributionPluginRef.current?.getPlugins() || [],
        };
        setJsonConfig(JSON.stringify(config, null, 2));
      } else {
        const config = JSON.parse(jsonConfig);
        transformPluginRef.current?.setPlugins(config.transform || []);
        distributionPluginRef.current?.setPlugins(config.distribution || []);
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
              transform: transformPluginRef.current?.getPlugins() || [],
              distribution: distributionPluginRef.current?.getPlugins() || [],
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
    toast.success("Configuration reset successfully!");
  };

  const handleTransform = () => {
    try {
      if (!transformPluginRef.current)
        throw new Error("Transform plugins not loaded");
      const transformed =
        transformPluginRef.current.applyTransformPlugins(content);
      setTransformedContent(transformed);
      toast.success("Transform completed successfully!");
    } catch (error: unknown) {
      toast.error(
        `Transform failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleDistribute = () => {
    try {
      if (!distributionPluginRef.current)
        throw new Error("Distribution plugins not loaded");
      distributionPluginRef.current.distributeContent(transformedContent);
      toast.success("Distribution completed successfully!");
    } catch (error: unknown) {
      toast.error(
        `Distribution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleRegistrySave = () => {
    try {
      const registryConfig = {
        transform: transformPluginRef.current?.getPlugins() || [],
        distribution: distributionPluginRef.current?.getPlugins() || [],
      };

      localStorage.setItem("registryConfig", JSON.stringify(registryConfig));
      toast.success("Registry saved successfully!");
    } catch {
      toast.error("Error saving registry");
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
            <TransformPlugin ref={transformPluginRef} />
            <DistributionPlugin ref={distributionPluginRef} />
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
