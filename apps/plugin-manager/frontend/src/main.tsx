import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Header from "./components/header.tsx";
import { Toaster } from "react-hot-toast";
import { PluginProvider } from "./lib/plugin-context.tsx";
import App from "./app.tsx";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Toaster />
      <PluginProvider>
        <Header />
        <App />
      </PluginProvider>
    </BrowserRouter>
  </StrictMode>,
);
