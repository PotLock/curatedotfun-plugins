import { Routes, Route } from "react-router-dom";
import PluginConfig from "./pages/pluginConfig";
import PluginRegistryPage from "./pages/pluginRegistry";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PluginConfig />} />
      <Route path="/plugin-registry" element={<PluginRegistryPage />} />
    </Routes>
  );
}
