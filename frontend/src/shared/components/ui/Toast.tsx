import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

type Tone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  tone: Tone;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error:   (message: string) => void;
  info:    (message: string) => void;
}

const ToastContext = createContext<ToastApi | undefined>(undefined);

let idSeq = 0;
const AUTO_DISMISS_MS = 3500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((tone: Tone, message: string) => {
    const id = ++idSeq;
    setToasts((cur) => [...cur, { id, tone, message }]);
    setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== id)), AUTO_DISMISS_MS);
  }, []);

  const api: ToastApi = {
    success: (m) => push('success', m),
    error:   (m) => push('error', m),
    info:    (m) => push('info', m),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} dismiss={(id) => setToasts((cur) => cur.filter((t) => t.id !== id))} />
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

function ToastViewport({ toasts, dismiss }: { toasts: ToastItem[]; dismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4 sm:left-auto sm:right-4 sm:items-end sm:px-0">
      {toasts.map((t) => <ToastRow key={t.id} toast={t} dismiss={() => dismiss(t.id)} />)}
    </div>
  );
}

function ToastRow({ toast, dismiss }: { toast: ToastItem; dismiss: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLeaving(true), AUTO_DISMISS_MS - 200);
    return () => clearTimeout(t);
  }, []);

  const Icon = toast.tone === 'success' ? CheckCircle2 : toast.tone === 'error' ? AlertCircle : Info;
  const iconTone =
    toast.tone === 'success' ? 'text-success' :
    toast.tone === 'error'   ? 'text-danger'  :
    'text-accent';

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-border bg-bg px-3.5 py-3 shadow-pop',
        leaving ? 'opacity-0 transition-opacity duration-200' : 'animate-scale-in',
      )}
    >
      <Icon size={18} className={cn('mt-0.5 shrink-0', iconTone)} />
      <p className="flex-1 text-sm text-fg">{toast.message}</p>
      <button onClick={dismiss} className="rounded p-0.5 text-muted hover:bg-surface hover:text-fg" aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}
