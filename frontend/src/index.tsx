import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/app/App";
import "@/styles/globals.css";

// Apply saved theme before first paint to prevent FOUC
const savedTheme = localStorage.getItem("rf_theme") ?? "system";
const resolved =
  savedTheme === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    : savedTheme;
document.documentElement.dataset.theme = resolved;
document.documentElement.style.colorScheme = resolved;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
