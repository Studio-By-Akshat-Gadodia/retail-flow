import { ReactNode } from "react";
import { useTheme, type Theme } from "@/features/settings/useTheme";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/shared/utils/cn";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const options: { value: Theme; icon: React.ElementType }[] = [
    { value: "light",  icon: Sun },
    { value: "dark",   icon: Moon },
    { value: "system", icon: Monitor },
  ];
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
      {options.map(({ value, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={value}
          className={cn(
            "rounded-md p-1.5 transition-colors",
            theme === value
              ? "bg-bg text-fg shadow-card"
              : "text-muted hover:text-fg"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Top bar */}
      <header className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
f          <img src={`${import.meta.env.BASE_URL}icons/icon.svg`} alt="RetailFlow" className="h-7 w-7 rounded-lg" />
          <span className="text-sm font-semibold text-fg">RetailFlow</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] text-muted">
        © {new Date().getFullYear()} RetailFlow. All rights reserved.
      </footer>
    </div>
  );
}
