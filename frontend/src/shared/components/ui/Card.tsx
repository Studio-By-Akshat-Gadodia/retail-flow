import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-border bg-bg shadow-card", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 pt-4 pb-0", className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-semibold text-fg", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-muted mt-0.5", className)} {...props} />;
}

interface StatCardProps {
  label: string;
  value: ReactNode;
  change?: string;
  positive?: boolean;
  icon?: ReactNode;
}

export function StatCard({ label, value, change, positive, icon }: StatCardProps) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted truncate">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-fg tabular">{value}</p>
            {change && (
              <p className={cn("mt-1 text-xs font-medium", positive ? "text-success" : "text-danger")}>
                {change}
              </p>
            )}
          </div>
          {icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
              {icon}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
