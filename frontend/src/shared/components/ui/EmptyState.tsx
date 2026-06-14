import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: typeof Inbox;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-bg px-6 py-12 text-center shadow-card">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-muted">
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <p className="mt-3 text-sm font-medium text-fg">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
