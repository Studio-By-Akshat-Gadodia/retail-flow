import { Navigate, Route, Routes } from "react-router-dom";
import { ROUTES } from "@/config/routes";
import { storage } from "@/lib/storage";
import { useStoreContext } from "@/features/stores/context/StoreContext";
import LoginPage from "@/pages/LoginPage";
import StoresPage from "@/pages/StoresPage";
import SettingsPage from "@/pages/SettingsPage";
import ProductsPage from "@/pages/ProductsPage";
import StockPage from "@/pages/StockPage";
import ReportsPage from "@/pages/ReportsPage";
import OverviewPage from "@/pages/OverviewPage";
import DashboardLayout from "@/layouts/DashboardLayout";

/* ── Guards ───────────────────────────────────────────── */

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!storage.getAccessToken()) return <Navigate to={ROUTES.LOGIN} replace />;
  return <>{children}</>;
}

function RequireStore({ children }: { children: React.ReactNode }) {
  const { currentStore, isLoading } = useStoreContext();
  if (isLoading) return null; // brief flash prevention
  if (!currentStore) return <Navigate to={ROUTES.STORES} replace />;
  return <>{children}</>;
}

/* ── Placeholder ──────────────────────────────────────── */

function Soon({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-xl font-semibold text-fg">{title}</h1>
      <p className="mt-1 text-sm text-muted">This section is coming soon.</p>
    </div>
  );
}

/* ── App shell (requires auth + store) ───────────────── */

function AppShell() {
  return (
    <RequireAuth>
      <RequireStore>
        <DashboardLayout>
          <Routes>
            <Route path={ROUTES.DASHBOARD} element={<OverviewPage />} />
            <Route path={ROUTES.PRODUCTS}  element={<ProductsPage />} />
            <Route path={ROUTES.STOCK}     element={<StockPage />} />
            <Route path={ROUTES.SUPPLIERS} element={<Soon title="Suppliers" />} />
            <Route path={ROUTES.SALES}     element={<Soon title="Sales" />} />
            <Route path={ROUTES.ALERTS}    element={<Soon title="Alerts" />} />
            <Route path={ROUTES.REPORTS}   element={<ReportsPage />} />
            <Route path={ROUTES.SETTINGS}  element={<SettingsPage />} />
            <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          </Routes>
        </DashboardLayout>
      </RequireStore>
    </RequireAuth>
  );
}

/* ── Root router ──────────────────────────────────────── */

export default function Router() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN}  element={<LoginPage />} />
      <Route
        path={ROUTES.STORES}
        element={
          <RequireAuth>
            <StoresPage />
          </RequireAuth>
        }
      />
      <Route path="/*" element={<AppShell />} />
    </Routes>
  );
}
