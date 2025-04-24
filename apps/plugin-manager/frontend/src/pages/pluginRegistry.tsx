import PluginRegistry from "@/components/plugin-config/plugin-registry";
import { updatePluginRegistry } from "../lib/registry";
import { usePluginContext } from "@/lib/plugin-context";
import toast from "react-hot-toast";

export default function PluginRegistryPage() {
  const { refreshRegistry } = usePluginContext();

  const handleRegistrySave = async (registryData: string) => {
    try {
      if (!registryData.trim()) {
        throw new Error("Registry data is empty");
      }

      // Parse the registry data
      const registry = JSON.parse(registryData);

      // Update the registry on the server
      await updatePluginRegistry(registry);

      // Refresh the registry in the context
      await refreshRegistry();

      toast.success("Registry updated successfully!");
    } catch (error) {
      toast.error(
        `Failed to update registry: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  return (
    <div className="flex flex-col gap-5 flex-1 w-full py-8 px-16">
      <PluginRegistry handleRegistrySave={handleRegistrySave} />
    </div>
  );
}
