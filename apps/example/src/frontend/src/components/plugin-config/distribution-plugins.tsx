import { useState, forwardRef, useImperativeHandle } from "react";
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

// Define the ref type for DistributionPlugin
export interface DistributionPluginRef {
  getPlugins: () => Plugin[];
  setPlugins: (newPlugins: Plugin[]) => void;
  distributeContent: (content: string) => void;
}

const DistributionPlugin = forwardRef<DistributionPluginRef>((_, ref) => {
  const defaultPlugins: Plugin[] = [
    {
      id: 0,
      type: "task",
      content: `{
        "botToken": "{TELEGRAM_BOT_TOKEN}",
        "channelId": "@your_channel"
      }`,
    },
    {
      id: 1,
      type: "note",
      content: `{
        "accountId": "{NEAR_ACCOUNT_ID}",
        "privateKey": "{NEAR_PRIVATE_KEY}",
        "networkId": "testnet"
      }`,
    },
    {
      id: 2,
      type: "reminder",
      content: `{
        "serviceUrl": "http://localhost:4001",
        "apiSecret": "{API_SECRET}"
      }`,
    },
  ];

  const [lists, setLists] = useState<Plugin[]>(defaultPlugins);
  const [count, setCount] = useState(defaultPlugins.length);

  useImperativeHandle(ref, () => ({
    getPlugins: () => lists,
    setPlugins: (newPlugins) => setLists(newPlugins),
    distributeContent: (content) => console.log("Distributed:", content),
  }));

  const addList = () => {
    setLists([...lists, { id: count, type: "", content: "" }]);
    setCount(count + 1);
  };

  const removeList = (id: number) => {
    setLists(lists.filter((list) => list.id !== id));
    setCount(count - 1);
  };

  const updateList = (id: number, field: "type" | "content", value: string) => {
    if (field === "content" && value.trim() !== "") {
      try {
        JSON.parse(value);
      } catch (error) {
        console.warn("Invalid JSON:", error);
        return;
      }
    }
    setLists(
      lists.map((list) =>
        list.id === id ? { ...list, [field]: value } : list,
      ),
    );
  };

  return (
    <div className="flex flex-col items-start p-4 max-w-lg gap-2 border rounded-md w-full">
      <h2 className="pb-5 text-2xl">Distribution Plugins</h2>

      <Button variant="outline" onClick={addList}>
        <Plus className="h-5 w-5" />
        <span> Add Plugin</span>
      </Button>

      {lists.map((list) => (
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
                  <SelectLabel>Names</SelectLabel>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
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
});

export default DistributionPlugin;
