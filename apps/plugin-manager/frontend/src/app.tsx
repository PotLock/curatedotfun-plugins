import { Switch, Route } from "react-router-dom";
import PluginConfig from "./pages/pluginConfig";
import PluginRegistryPage from "./pages/pluginRegistry";
import SourceQueryPage from "./pages/SourceQueryPage"; // Import the new page

export default function App() {
  return (
    <Switch>
      <Route path="/" component={PluginConfig} exact />
      <Route path="/plugin-registry" component={PluginRegistryPage} />
      <Route path="/source-query" component={SourceQueryPage} />{" "}
      {/* Add route for source query page */}
    </Switch>
  );
}
