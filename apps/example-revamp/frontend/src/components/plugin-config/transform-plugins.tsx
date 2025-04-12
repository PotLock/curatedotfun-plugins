import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { usePluginContext } from "../../lib/plugin-context";

// Define the Plugin type
export type Plugin = {
  id: number;
  type: string;
  content: string;
};

interface TransformPluginProps {
  plugins: Plugin[];
  onPluginsChange: (plugins: Plugin[]) => void;
}

const TransformPlugin = ({
  plugins,
  onPluginsChange,
}: TransformPluginProps) => {
  const { availablePlugins, pluginDefaults } = usePluginContext();
  const [count, setCount] = useState(() => plugins.length);

  // Initialize with default plugins when available plugins are loaded
  useEffect(() => {
    if (availablePlugins.transformer.length > 0 && plugins.length === 0) {
      const initialPlugins = availablePlugins.transformer
        .slice(0, 3)
        .map((pluginName, index) => ({
          id: index,
          type: pluginName,
          content: JSON.stringify(pluginDefaults[pluginName] || {}, null, 2),
        }));

      onPluginsChange(initialPlugins);
      setCount(initialPlugins.length);
    }
  }, [
    availablePlugins.transformer,
    pluginDefaults,
    plugins.length,
    onPluginsChange,
  ]);

  // Add a new plugin
  const addPlugin = () => {
    onPluginsChange([
      ...plugins,
      { id: plugins.length, type: "", content: "" },
    ]);
    setCount(count + 1);
  };

  // Remove a plugin
  const removePlugin = (id: number) => {
    onPluginsChange(plugins.filter((plugin) => plugin.id !== id));
    setCount(count - 1);
  };

  // Update plugin data
  const updatePlugin = (
    id: number,
    field: "type" | "content",
    value: string,
  ) => {
    if (field === "type") {
      // When plugin type changes, load the default configuration
      onPluginsChange(
        plugins.map((plugin) =>
          plugin.id === id
            ? {
                ...plugin,
                type: value,
                content: JSON.stringify(pluginDefaults[value] || {}, null, 2),
              }
            : plugin,
        ),
      );
    } else {
      // For content updates, just update the content
      onPluginsChange(
        plugins.map((plugin) =>
          plugin.id === id ? { ...plugin, [field]: value } : plugin,
        ),
      );
    }
  };

  return (
    <div className="flex flex-col items-start p-4 gap-2 border rounded-md w-full">
      <h2 className="pb-5 text-2xl">Transform Plugins</h2>

      {/* Add Plugin Button */}
      <Button variant="outline" onClick={addPlugin}>
        <Plus className="h-5 w-5" />
        <span> Add Plugin</span>
      </Button>

      {/* Plugin List */}
      {plugins.map((plugin) => (
        <div
          key={plugin.id}
          className="mb-4 p-4 rounded-md shadow bg-white w-full border space-y-2"
        >
          {/* Dropdown Selection */}
          <div>
            <h3 className="p-1 text-md">Plugin Name</h3>
            <Select
              value={plugin.type}
              onValueChange={(value) => updatePlugin(plugin.id, "type", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a Plugin Name" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Transform Plugins</SelectLabel>
                  {availablePlugins.transformer.length === 0 ? (
                    <SelectItem value="" disabled>
                      Loading plugins...
                    </SelectItem>
                  ) : (
                    availablePlugins.transformer.map((pluginName) => (
                      <SelectItem key={pluginName} value={pluginName}>
                        {pluginName}
                      </SelectItem>
                    ))
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Scrollable Textarea */}
          <div>
            <h3 className="p-1 text-md">Plugin Configuration</h3>
            <Textarea
              value={plugin.content}
              onChange={(e) =>
                updatePlugin(plugin.id, "content", e.target.value)
              }
              className="w-full p-2 border rounded-md h-24 overflow-y-auto"
              placeholder="Plugin Configuration..."
            />
          </div>

          {/* Remove Plugin Button */}
          <Button
            onClick={() => removePlugin(plugin.id)}
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
          >
            Remove
          </Button>
        </div>
      ))}
    </div>
  );
};

export default TransformPlugin;
