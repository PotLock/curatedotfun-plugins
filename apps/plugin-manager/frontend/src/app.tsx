import { Switch, Route } from "react-router-dom";
import PluginConfig from "./pages/pluginConfig";
import PluginRegistryPage from "./pages/pluginRegistry";

export default function App() {
  return (
    <Switch>
      <Route path="/" component={PluginConfig} exact />
      <Route path="/plugin-registry" component={PluginRegistryPage} />
    </Switch>
  );
}
