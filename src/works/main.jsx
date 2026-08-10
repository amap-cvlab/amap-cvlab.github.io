import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/ibm-plex-sans";
import "@fontsource/ibm-plex-sans-condensed/600.css";
import "@fontsource/ibm-plex-sans-condensed/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import { WorksApp } from "./WorksApp";
import "../styles/foundation.css";
import "../styles/chrome.css";
import "../styles/works.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WorksApp />
  </React.StrictMode>,
);
