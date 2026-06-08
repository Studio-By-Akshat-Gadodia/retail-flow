import { useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useInstallPrompt } from "@/shared/hooks/useInstallPrompt";
import { RefreshCw, Download, X } from "lucide-react";

function UpdateToast({ onUpdate }: { onUpdate: () => void }) {
  return (
    <div className="fixed bottom-20 right-4 z-50 flex items-center gap-3 rounded-xl border border-border bg-bg px-4 py-3 shadow-pop animate-scale-in lg:bottom-6">
      <RefreshCw className="h-4 w-4 shrink-0 text-accent" />
      <span className="text-sm text-fg">A new version is available.</span>
      <button
        onClick={onUpdate}
        className="text-xs font-semibold text-accent hover:underline"
      >
        Update
      </button>
    </div>
  );
}

function InstallBanner({ onInstall, onDismiss }: { onInstall: () => void; onDismiss: () => void }) {
  return (
    <div className="fixed bottom-20 left-4 z-50 flex max-w-[280px] items-start gap-3 rounded-xl border border-border bg-bg px-4 py-3 shadow-pop animate-scale-in lg:bottom-6">
      <Download className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-fg">Install RetailFlow</p>
        <p className="text-xs text-muted">Works offline on the warehouse floor.</p>
        <button
          onClick={onInstall}
          className="mt-2 text-xs font-semibold text-accent hover:underline"
        >
          Add to home screen
        </button>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-muted hover:text-fg transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function PWAPrompts() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();
  const { canInstall, install } = useInstallPrompt();
  const [installDismissed, setInstallDismissed] = useState(false);

  return (
    <>
      {needRefresh && (
        <UpdateToast onUpdate={() => updateServiceWorker(true)} />
      )}
      {canInstall && !installDismissed && (
        <InstallBanner
          onInstall={install}
          onDismiss={() => setInstallDismissed(true)}
        />
      )}
    </>
  );
}
