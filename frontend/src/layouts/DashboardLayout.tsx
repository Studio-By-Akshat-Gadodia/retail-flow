import { ReactNode, useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, Boxes, Truck, ShoppingCart,
  Bell, BarChart3, Settings, LogOut, Sun, Moon, Monitor,
  X, MoreHorizontal,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useMe, useLogout } from "@/features/auth/hooks/useAuth";
import { useTheme, type Theme } from "@/features/settings/useTheme";
import { ROUTES } from "@/config/routes";
import Avatar from "@/shared/components/ui/Avatar";
import StoreSwitcher from "@/features/stores/components/StoreSwitcher";

/* ── Navigation definition ─────────────────────────────── */

const NAV = [
  { to: ROUTES.DASHBOARD, label: "Overview",   icon: LayoutDashboard },
  { to: ROUTES.PRODUCTS,  label: "Products",   icon: Package },
  { to: ROUTES.STOCK,     label: "Inventory",  icon: Boxes },
  { to: ROUTES.SUPPLIERS, label: "Suppliers",  icon: Truck },
  { to: ROUTES.SALES,     label: "Sales",      icon: ShoppingCart },
  { to: ROUTES.ALERTS,    label: "Alerts",     icon: Bell },
  { to: ROUTES.REPORTS,   label: "Reports",    icon: BarChart3 },
] as const;

const MOBILE_PRIMARY = NAV.slice(0, 5);
const MOBILE_MORE    = [...NAV.slice(5), { to: ROUTES.SETTINGS, label: "Settings", icon: Settings }];

const PAGE_TITLES: Record<string, string> = {
  [ROUTES.DASHBOARD]: "Overview",
  [ROUTES.PRODUCTS]:  "Products",
  [ROUTES.STOCK]:     "Inventory",
  [ROUTES.SUPPLIERS]: "Suppliers",
  [ROUTES.SALES]:     "Sales",
  [ROUTES.ALERTS]:    "Alerts",
  [ROUTES.REPORTS]:   "Reports",
  [ROUTES.SETTINGS]:  "Settings",
};

/* ── Sub-components ─────────────────────────────────────── */

function SidebarNavItem({
  to, label, icon: Icon, end, onClick,
}: {
  to: string; label: string; icon: React.ElementType;
  end?: boolean; onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-surface font-medium text-fg"
            : "text-muted hover:bg-surface hover:text-fg"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn("h-4 w-4 shrink-0", isActive ? "stroke-2" : "stroke-[1.5]")} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

function ThemeCycler() {
  const { theme, setTheme } = useTheme();

  const options: { value: Theme; icon: React.ElementType; label: string }[] = [
    { value: "light",  icon: Sun,     label: "Light" },
    { value: "dark",   icon: Moon,    label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ];

  const current = options.find(o => o.value === theme) ?? options[2];
  const next = options[(options.indexOf(current) + 1) % options.length];
  const Icon = current.icon;

  return (
    <button
      onClick={() => setTheme(next.value)}
      title={`Switch to ${next.label}`}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-fg"
    >
      <Icon className="h-4 w-4 shrink-0 stroke-[1.5]" />
      <span>{current.label} mode</span>
    </button>
  );
}

function MoreSheet({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 lg:hidden" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-fg/40 backdrop-blur-[2px] animate-fade-in" />
      {/* Sheet */}
      <div
        className="absolute bottom-0 inset-x-0 rounded-t-2xl border-t border-border bg-bg px-4 pb-8 pt-4 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-fg">More</span>
          <button onClick={onClose} className="rounded-md p-1 text-muted hover:text-fg hover:bg-surface">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {MOBILE_MORE.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === ROUTES.DASHBOARD}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1.5 rounded-xl p-3 text-center text-xs font-medium transition-colors",
                  isActive
                    ? "bg-surface text-fg"
                    : "text-muted hover:bg-surface hover:text-fg"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("h-5 w-5", isActive ? "stroke-2" : "stroke-[1.5]")} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main layout ────────────────────────────────────────── */

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: user } = useMe();
  const logout = useLogout();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const pageTitle = PAGE_TITLES[location.pathname] ?? "RetailFlow";
  const fullName = user ? `${user.first_name} ${user.last_name}`.trim() : "";

  return (
    <div className="flex min-h-full bg-bg">

      {/* ── Desktop Sidebar ──────────────────────────────── */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-60 lg:flex-col border-r border-border bg-bg">

        {/* Brand + Store switcher */}
        <div className="shrink-0 border-b border-border px-3 py-3 space-y-2">
          <div className="flex items-center gap-2.5 px-1">
            <img src="/icons/icon.svg" alt="RetailFlow" className="h-6 w-6 rounded-md" />
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">RetailFlow</span>
          </div>
          <StoreSwitcher />
        </div>

        {/* Navigation */}
        <nav className="no-scrollbar flex-1 overflow-y-auto p-2 space-y-0.5">
          {NAV.map(item => (
            <SidebarNavItem key={item.to} {...item} end={item.to === ROUTES.DASHBOARD} />
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-border p-2 space-y-0.5">
          <SidebarNavItem to={ROUTES.SETTINGS} label="Settings" icon={Settings} />
          <ThemeCycler />

          {/* User row */}
          <div className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2">
            <Avatar name={fullName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-fg">{fullName || "User"}</p>
              <p className="truncate text-[11px] text-muted">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="shrink-0 rounded-md p-1 text-muted hover:bg-surface hover:text-fg transition-colors"
            >
              <LogOut className="h-3.5 w-3.5 stroke-[1.5]" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Right side (header + content + mobile nav) ───── */}
      <div className="flex min-h-full w-full flex-col lg:pl-60">

        {/* Mobile sticky header */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-bg/90 px-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2.5">
            <img src="/icons/icon.svg" alt="" className="h-6 w-6 rounded-md" />
            <span className="text-sm font-semibold text-fg">{pageTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <Avatar name={fullName} size="sm" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>

        {/* Mobile bottom navigation */}
        <nav className="fixed bottom-0 inset-x-0 z-30 flex items-center justify-around border-t border-border bg-bg/90 backdrop-blur safe-b lg:hidden">
          {MOBILE_PRIMARY.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === ROUTES.DASHBOARD}
              className={({ isActive }) =>
                cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors",
                  isActive ? "text-fg" : "text-muted"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 h-0.5 w-8 rounded-full bg-fg" />
                  )}
                  <Icon className={cn("h-5 w-5", isActive ? "stroke-2" : "stroke-[1.5]")} />
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex min-w-0 flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium text-muted transition-colors hover:text-fg"
          >
            <MoreHorizontal className="h-5 w-5 stroke-[1.5]" />
            <span>More</span>
          </button>
        </nav>

        {/* Bottom nav spacer on mobile */}
        <div className="h-16 shrink-0 lg:hidden" />
      </div>

      {/* More sheet */}
      {moreOpen && <MoreSheet onClose={() => setMoreOpen(false)} />}
    </div>
  );
}
