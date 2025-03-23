import { RefreshCw, Save, Undo2 } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import TransformPlugin from "./plugin-config/transform-plugins";
import DistributionPlugin from "./plugin-config/distribution-plugins";
import toast from "react-hot-toast";
import { Textarea } from "./ui/textarea";
import PluginRegistry from "./plugin-config/plugin-registry";

export default function PluginConfig() {
  const [view, setView] = useState<"json" | "config">("config");

  const toggleView = () => {
    setView(view === "json" ? "config" : "json");
  };

  const handleSave = () => {
    console.log("Save config");
    toast.success("Configuration saved successfully!");
  };

  const reset = () => {
    console.log("Reset config");
    toast.success("Configuration reset successfully!");
  };

  const handleTransform = () => {
    console.log("Transform");
    toast.success("Transform started successfully!");
  };

  const handleDistribute = () => {
    console.log("Distribute");
    toast.success("Distribution started successfully!");
  };

  const handleRegistrySave = () => {
    console.log("Save registry");
    toast.success("Registry saved successfully!");
  };

  return (
    <>
      <div className="flex py-8 px-16 min-h-screen relative gap-14">
        <div className="flex flex-col gap-5 flex-1 w-full">
          <h1 className="text-3xl">Plugin Configuration</h1>
          <div className="flex items-center justify-start mt-5 gap-2">
            <Button
              variant="outline"
              onClick={toggleView}
              className="group cursor-pointer"
            >
              <RefreshCw className="h-5 w-5 transition-transform duration-200 group-hover:rotate-90" />
              <span>Switch to {view === "json" ? "Config" : "JSON"} View</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleSave}
              className="group cursor-pointer"
            >
              <Save className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
              <span>Save Configration</span>
            </Button>
            <Button
              variant="outline"
              onClick={reset}
              className="group relative cursor-pointer bg-transparent transition-all duration-200 hover:shadow-red-500/30 hover:shadow-xl hover:bg-red-500/10 hover:border-red-500/0"
            >
              <Undo2 className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
              <span>Reset</span>
            </Button>
          </div>
          {view === "json" ? (
            <div className="flex flex-col items-start justify-start gap-2">
              <Textarea
                className="w-full h-96 p-4 border border-neutral-300 rounded-lg"
                placeholder="Enter your plugin json here..."
              />
            </div>
          ) : (
            <>
              <TransformPlugin />
              <DistributionPlugin />
            </>
          )}
          <PluginRegistry handleRegistrySave={handleRegistrySave} />
        </div>

        <div className="flex flex-col flex-1 gap-5 sticky top-0 h-fit max-h-screen py-10">
          <div className="flex flex-col items-start justify-start gap-5">
            <div className="flex flex-col items-start justify-start gap-2">
              <h1 className="text-3xl">Content</h1>
              <p>Enter your content below and use transform to modify it.</p>
            </div>
            <Textarea placeholder="Enter your content... " className=" h-24" />
            <Button variant="outline" onClick={handleTransform}>
              Transform Content
            </Button>
          </div>
          <div className="flex flex-col items-start justify-start gap-5">
            <div className="flex flex-col items-start justify-start gap-2">
              <h1 className="text-3xl">Distribution</h1>
              <p>
                Click the button below to distribute the transformed content
                using the configured plugins.
              </p>
            </div>

            <Button variant="outline" onClick={handleDistribute}>
              Distribute
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
