import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PluginMetadata {
  url: string;
  type: string;
}

interface PluginRegistry {
  [name: string]: PluginMetadata;
}

const SourceQueryPage: React.FC = () => {
  const [pluginName, setPluginName] = useState<string>("");
  const [options, setOptions] = useState<string>("");
  const [pluginConfig, setPluginConfig] = useState<string>(""); // Renamed from 'config' to avoid conflict
  const [lastProcessedState, setLastProcessedState] = useState<string>(""); // Added lastProcessedState
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pluginRegistry, setPluginRegistry] = useState<PluginRegistry | null>(
    null,
  );

  useEffect(() => {
    const fetchRegistry = async () => {
      try {
        const response = await fetch("/api/plugin-registry");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          setPluginRegistry(data.registry);
        } else {
          setError(data.error || "Failed to fetch plugin registry");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    };
    fetchRegistry();
  }, []);

  const handleFormatJson = (value: string, setter: (value: string) => void) => {
    try {
      if (value.trim() === "") {
        setter(""); // Clear if input is empty or only whitespace
        return;
      }
      const parsed = JSON.parse(value);
      setter(JSON.stringify(parsed, null, 2));
    } catch (error) {
      // If JSON is invalid, do nothing and leave the current text as is.
      // The main handleSubmit will catch and display this error.
      console.warn("Failed to auto-format JSON:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setError(null);

    if (!pluginName) {
      setError("Plugin name is required.");
      setIsLoading(false);
      return;
    }

    let parsedOptions;
    try {
      parsedOptions = options ? JSON.parse(options) : {};
    } catch {
      setError("Invalid JSON in options.");
      setIsLoading(false);
      return;
    }

    let parsedConfig;
    try {
      parsedConfig = pluginConfig ? JSON.parse(pluginConfig) : {};
    } catch {
      setError("Invalid JSON in plugin config.");
      setIsLoading(false);
      return;
    }

    let parsedLastProcessedState;
    try {
      parsedLastProcessedState = lastProcessedState
        ? JSON.parse(lastProcessedState)
        : null;
    } catch {
      setError("Invalid JSON in Last Processed State.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/source/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pluginName,
          options: parsedOptions,
          config: parsedConfig,
          lastProcessedState: parsedLastProcessedState,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const outputResult = data.output;
        setResult(JSON.stringify(outputResult, null, 2));
        // Update lastProcessedState from the response if available
        // Based on the example: data.output.currentMasaJob could be the new state
        if (
          outputResult &&
          typeof outputResult === "object" &&
          "currentMasaJob" in outputResult
        ) {
          setLastProcessedState(
            JSON.stringify(
              { currentMasaJob: outputResult.currentMasaJob },
              null,
              2,
            ),
          );
        } else if (
          outputResult &&
          typeof outputResult === "object" &&
          "lastProcessedState" in outputResult
        ) {
          // Or if the backend explicitly returns a field named lastProcessedState
          setLastProcessedState(
            JSON.stringify(outputResult.lastProcessedState, null, 2),
          );
        }
      } else {
        setError(data.error || `Request failed with status ${response.status}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const sourcePlugins = pluginRegistry
    ? Object.entries(pluginRegistry).filter(
        ([, meta]) => meta.type === "source",
      )
    : [];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Query Source Plugin</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="pluginName">Plugin Name</Label>
          {pluginRegistry ? (
            <Select value={pluginName} onValueChange={setPluginName}>
              <SelectTrigger id="pluginName">
                <SelectValue placeholder="Select a source plugin" />
              </SelectTrigger>
              <SelectContent>
                {sourcePlugins.length > 0 ? (
                  sourcePlugins.map(([name]) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-source-plugins" disabled>
                    No source plugins available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          ) : (
            <Input id="pluginName" value="Loading plugins..." disabled />
          )}
        </div>
        <div>
          <Label htmlFor="options">Search Options (JSON)</Label>
          <Textarea
            id="options"
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            onBlur={() => handleFormatJson(options, setOptions)}
            placeholder='e.g., { "query": "AI research", "pageSize": 15, "platformArgs": { "hashtags": ["#deeplearning"], "fromAccounts": ["exampleUser"], "minLikes": 50 } }'
            rows={5}
          />
        </div>
        <div>
          <Label htmlFor="pluginConfig">
            Plugin Initialization Config (JSON)
          </Label>
          <Textarea
            id="pluginConfig"
            value={pluginConfig}
            onChange={(e) => setPluginConfig(e.target.value)}
            onBlur={() => handleFormatJson(pluginConfig, setPluginConfig)}
            placeholder='e.g., { "apiKey": "YOUR_API_KEY" } (if applicable)'
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="lastProcessedState">
            Last Processed State (JSON)
          </Label>
          <Textarea
            id="lastProcessedState"
            value={lastProcessedState}
            onChange={(e) => setLastProcessedState(e.target.value)}
            onBlur={() =>
              handleFormatJson(lastProcessedState, setLastProcessedState)
            }
            placeholder='e.g., { "currentMasaJob": { "jobId": "...", "status": "...", ... } } (leave empty if none)'
            rows={5}
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Querying..." : "Query Plugin"}
        </Button>
      </form>
      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-700 border border-red-400 rounded">
          <p>Error:</p>
          <pre className="whitespace-pre-wrap">{error}</pre>
        </div>
      )}
      {result && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Result:</h2>
          <pre className="p-2 bg-gray-100 border rounded overflow-x-auto">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SourceQueryPage;
