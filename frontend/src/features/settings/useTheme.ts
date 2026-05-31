import { useState, useEffect, useCallback } from "react";

export type Theme = "light" | "dark" | "system";

const KEY = "rf_theme";

function resolve(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const resolved = resolve(theme);
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(KEY) as Theme) ?? "system"
  );

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem(KEY, t);
    setThemeState(t);
  }, []);

  const isDark = resolve(theme) === "dark";

  return { theme, setTheme, isDark };
}
