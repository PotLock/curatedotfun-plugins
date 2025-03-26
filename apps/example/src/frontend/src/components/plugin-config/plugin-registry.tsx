import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

interface PluginRegistryProps {
  handleRegistrySave: (registryData: string) => void;
}

export default function PluginRegistry({
  handleRegistrySave,
}: PluginRegistryProps) {
  const [registryData, setRegistryData] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(true);

  const validateJson = (value: string) => {
    try {
      if (value.trim()) {
        JSON.parse(value);
        setIsValid(true);
      }
    } catch (error) {
      console.error("JSON Parsing Error:", error);
      setIsValid(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setRegistryData(value);
    validateJson(value);
  };

  return (
    <div className="flex flex-col items-start gap-5 w-full">
      <div className="flex flex-col items-start justify-start gap-2">
        <h1 className="text-3xl">Plugin Registry</h1>
        <p>Edit the plugin registry to add or modify available plugins.</p>
      </div>
      <Textarea
        className="w-full h-60 p-4 border border-neutral-300 rounded-lg"
        placeholder="Enter your plugin JSON here..."
        value={registryData}
        onChange={handleChange}
        aria-invalid={!isValid}
      />
      {!isValid && <p className="text-red-500 text-sm">Invalid JSON format</p>}
      <Button
        className="mt-2 cursor-pointer"
        onClick={() => handleRegistrySave(registryData)}
        disabled={!isValid || !registryData.trim()}
      >
        Update Registry
      </Button>
    </div>
  );
}
