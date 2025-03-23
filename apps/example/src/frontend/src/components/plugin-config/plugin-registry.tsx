import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

interface PluginRegistryProps {
  handleRegistrySave: () => void;
}

export default function PluginRegistry({
  handleRegistrySave,
}: PluginRegistryProps) {
  return (
    <div className="flex flex-col items-start gap-5 w-full">
      <div className="flex flex-col items-start justify-start gap-2">
        <h1 className="text-3xl">Plugin Registry</h1>
        <p>Edit the plugin registry to add or modify available plugins.</p>
      </div>
      <Textarea
        className="w-full h-60 p-4 border border-neutral-300 rounded-lg"
        placeholder="Enter your plugin json here..."
      />
      <Button className="mt-2 cursor-pointer" onClick={handleRegistrySave}>
        Update Registry
      </Button>
    </div>
  );
}
