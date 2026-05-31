/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:             "hsl(var(--color-bg))",
        surface:        "hsl(var(--color-surface))",
        "surface-2":    "hsl(var(--color-surface-2))",
        border:         "hsl(var(--color-border))",
        "border-strong":"hsl(var(--color-border-strong))",
        muted:          "hsl(var(--color-muted))",
        "muted-fg":     "hsl(var(--color-muted-fg))",
        fg:             "hsl(var(--color-fg))",
        primary:        "hsl(var(--color-primary))",
        "primary-fg":   "hsl(var(--color-primary-fg))",
        accent:         "hsl(var(--color-accent))",
        "accent-soft":  "hsl(var(--color-accent-soft))",
        danger:         "hsl(var(--color-danger))",
        "danger-soft":  "hsl(var(--color-danger-soft))",
        success:        "hsl(var(--color-success))",
        "success-soft": "hsl(var(--color-success-soft))",
        warning:        "hsl(var(--color-warning))",
        "warning-soft": "hsl(var(--color-warning-soft))",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        pop:  "0 8px 24px -8px rgb(0 0 0 / 0.18), 0 2px 6px -2px rgb(0 0 0 / 0.08)",
        fab:  "0 8px 24px -6px rgb(15 23 42 / 0.35)",
      },
      keyframes: {
        "fade-in":  { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": { from: { transform: "translateY(100%)" }, to: { transform: "translateY(0)" } },
        "scale-in": { from: { opacity: "0", transform: "scale(0.96)" }, to: { opacity: "1", transform: "scale(1)" } },
        shimmer:    { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(100%)" } },
      },
      animation: {
        "fade-in":  "fade-in 150ms ease-out",
        "slide-up": "slide-up 220ms cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scale-in 150ms ease-out",
        shimmer:    "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};
