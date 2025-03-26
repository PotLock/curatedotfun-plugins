import { forwardRef, useImperativeHandle, useState } from "react";
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

// Define the Plugin type
type Plugin = {
  id: number;
  type: string;
  content: string;
};

// Define the ref type for TransformPlugin
export interface TransformPluginRef {
  getPlugins: () => Plugin[];
  setPlugins: (newPlugins: Plugin[]) => void;
  applyTransformPlugins: (content: string) => string;
}

const TransformPlugin = forwardRef<TransformPluginRef>((_, ref) => {
  const defaultPlugins: Plugin[] = [
    {
      id: 0,
      type: "task",
      content: `{
            "prompt": "Transform this into an engaging news article with a title and content.",
            "apiKey": "{OPENROUTER_API_KEY}",
            "schema": {
              "title": {
                "type": "string",
                "description": "Engaging title for the article"
              },
              "content": {
                "type": "string",
                "description": "Article content in HTML format"
              }
            }
          }`,
    },
    {
      id: 1,
      type: "note",
      content: `{
            "mappings": {
              "title": "{{title}}",
              "content": "{{content}}",
              "link": "https://example.com/posts/{{id}}",
              "publishedAt": "{{timestamp}}",
              "guid": "post-{{id}}"
            }
          }`,
    },
    {
      id: 2,
      type: "reminder",
      content: `{
            "format": "🚀 {{title}} \\n\\n {{content}} \\n\\n#{{#tags}}#{{.}}{{/tags}}"
          }`,
    },
  ];

  const [plugins, setPlugins] = useState<Plugin[]>(defaultPlugins);
  const [count, setCount] = useState(defaultPlugins.length);

  // Expose methods for parent components
  useImperativeHandle(ref, () => ({
    getPlugins: () => plugins,
    setPlugins: (newPlugins) => setPlugins(newPlugins),
    applyTransformPlugins: (content) => `Transformed: ${content}`,
  }));

  // Add a new plugin
  const addPlugin = () => {
    setPlugins([...plugins, { id: plugins.length, type: "", content: "" }]);
    setCount(count + 1);
  };

  // Remove a plugin
  const removePlugin = (id: number) => {
    setPlugins(plugins.filter((plugin) => plugin.id !== id));
    setCount(count - 1);
  };

  // Update plugin data
  const updatePlugin = (
    id: number,
    field: "type" | "content",
    value: string,
  ) => {
    setPlugins(
      plugins.map((plugin) =>
        plugin.id === id ? { ...plugin, [field]: value } : plugin,
      ),
    );
  };

  return (
    <div className="flex flex-col items-start p-4 max-w-lg gap-2 border rounded-md w-full">
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
                  <SelectLabel>Names</SelectLabel>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
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
});

export default TransformPlugin;
