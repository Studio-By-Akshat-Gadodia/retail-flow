import { HTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";

export type BadgeTone = "neutral" | "success" | "danger" | "accent" | "warning";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-muted-fg",
  success: "bg-success-soft text-success",
  danger:  "bg-danger-soft text-danger",
  accent:  "bg-accent-soft text-accent",
  warning: "bg-warning-soft text-warning",
};

export default function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
