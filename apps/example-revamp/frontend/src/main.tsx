import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Header from "./components/header.tsx";
import Hero from "./components/hero.tsx";
import PluginConfig from "./components/plugin-config.tsx";
import { Toaster } from "react-hot-toast";
import { PluginProvider } from "./lib/plugin-context.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Toaster />
    <PluginProvider>
      <Header />
      <Hero
        title="Curate.fun Plugins"
        description="A curated list of plugins for Curate.fun"
      />
      <PluginConfig />
    </PluginProvider>
  </StrictMode>,
);
