import { useEffect, useState } from "react";

type ChartColors = {
  accent:  string;
  success: string;
  danger:  string;
  muted:   string;
  border:  string;
  fg:      string;
  surface: string;
  bg:      string;
};

function readColors(): ChartColors {
  const s   = getComputedStyle(document.documentElement);
  const hsl = (v: string) => `hsl(${s.getPropertyValue(v).trim()})`;
  return {
    accent:  hsl("--color-accent"),
    success: hsl("--color-success"),
    danger:  hsl("--color-danger"),
    muted:   hsl("--color-muted"),
    border:  hsl("--color-border"),
    fg:      hsl("--color-fg"),
    surface: hsl("--color-surface"),
    bg:      hsl("--color-bg"),
  };
}

export function useChartColors(): ChartColors {
  const [colors, setColors] = useState(readColors);

  useEffect(() => {
    const observer = new MutationObserver(() => setColors(readColors()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return colors;
}
