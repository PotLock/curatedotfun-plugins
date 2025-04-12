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

interface DistributionPluginProps {
  plugins: Plugin[];
  onPluginsChange: (plugins: Plugin[]) => void;
}

const DistributionPlugin = ({
  plugins,
  onPluginsChange,
}: DistributionPluginProps) => {
  const { availablePlugins, pluginDefaults } = usePluginContext();
  const [count, setCount] = useState(() => plugins.length);

  // Initialize with default plugins when available plugins are loaded
  useEffect(() => {
    if (availablePlugins.distributor.length > 0 && plugins.length === 0) {
      const initialPlugins = availablePlugins.distributor
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
    availablePlugins.distributor,
    pluginDefaults,
    plugins.length,
    onPluginsChange,
  ]);

  const addList = () => {
    onPluginsChange([...plugins, { id: count, type: "", content: "" }]);
    setCount(count + 1);
  };

  const removeList = (id: number) => {
    onPluginsChange(plugins.filter((list) => list.id !== id));
    setCount(count - 1);
  };

  const updateList = (id: number, field: "type" | "content", value: string) => {
    if (field === "type") {
      // When plugin type changes, load the default configuration
      onPluginsChange(
        plugins.map((list) =>
          list.id === id
            ? {
                ...list,
                type: value,
                content: JSON.stringify(pluginDefaults[value] || {}, null, 2),
              }
            : list,
        ),
      );
    } else if (field === "content" && value.trim() !== "") {
      // Validate JSON for content updates
      try {
        JSON.parse(value);
        onPluginsChange(
          plugins.map((list) =>
            list.id === id ? { ...list, content: value } : list,
          ),
        );
      } catch (error) {
        console.warn("Invalid JSON:", error);
        return;
      }
    } else {
      // For empty content or other fields
      onPluginsChange(
        plugins.map((list) =>
          list.id === id ? { ...list, [field]: value } : list,
        ),
      );
    }
  };

  return (
    <div className="flex flex-col items-start p-4 gap-2 border rounded-md w-full">
      <h2 className="pb-5 text-2xl">Distribution Plugins</h2>

      <Button variant="outline" onClick={addList}>
        <Plus className="h-5 w-5" />
        <span> Add Plugin</span>
      </Button>

      {plugins.map((list) => (
        <div
          key={list.id}
          className="mb-4 p-4 rounded-md shadow bg-white w-full border space-y-2"
        >
          <div>
            <h3 className="p-1 text-md">Plugin Name</h3>
            <Select
              value={list.type}
              onValueChange={(value) => updateList(list.id, "type", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a Plugin Name" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Distribution Plugins</SelectLabel>
                  {availablePlugins.distributor.length === 0 ? (
                    <SelectItem value="" disabled>
                      Loading plugins...
                    </SelectItem>
                  ) : (
                    availablePlugins.distributor.map((pluginName) => (
                      <SelectItem key={pluginName} value={pluginName}>
                        {pluginName}
                      </SelectItem>
                    ))
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div>
            <h3 className="p-1 text-md">Plugin Configuration</h3>
            <Textarea
              value={list.content}
              onChange={(e) => updateList(list.id, "content", e.target.value)}
              className="w-full p-2 border rounded-md h-24 overflow-y-auto"
              placeholder="Plugin Configuration..."
            />
          </div>

          <Button
            onClick={() => removeList(list.id)}
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
          >
            Remove
          </Button>
        </div>
      ))}
    </div>
  );
};

export default DistributionPlugin;
