import { useState } from "react";
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

export default function TransformPlugin() {
  const defaultPlugins = [
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

  const [lists, setLists] = useState(defaultPlugins);
  const [count, setCount] = useState(defaultPlugins.length);

  // Add a new list item
  const addList = () => {
    setLists([...lists, { id: count, type: "", content: "" }]);
    setCount(count + 1);
  };

  // Remove a specific list item
  const removeList = (id: number) => {
    setLists(lists.filter((list) => list.id !== id));
  };

  // Handle changes in the dropdown or textarea
  const updateList = (id: number, field: "type" | "content", value: string) => {
    setLists(
      lists.map((list) =>
        list.id === id ? { ...list, [field]: value } : list,
      ),
    );
  };

  return (
    <div className="flex flex-col items-start p-4 max-w-lg gap-2 border rounded-md w-full">
      <h2 className="pb-5 text-2xl">Transform Plugins</h2>

      {/* Add New List Button */}
      <Button variant="outline" onClick={addList} className="cursor-pointer">
        <Plus className="h-5 w-5" />
        <span> Add List</span>
      </Button>

      {/* Dynamic List Items */}
      {lists.map((list) => (
        <div
          key={list.id}
          className="mb-4 p-4 rounded-md shadow bg-white w-full border space-y-2"
        >
          {/* Dropdown Selection */}
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
              value={list.content}
              onChange={(e) => updateList(list.id, "content", e.target.value)}
              className="w-full p-2 border rounded-md h-24 overflow-y-auto"
              placeholder="Plugin Configuration..."
            ></Textarea>
          </div>
          {/* Remove Button */}
          <Button
            onClick={() => removeList(list.id)}
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition cursor-pointer"
          >
            Remove
          </Button>
        </div>
      ))}
    </div>
  );
}
