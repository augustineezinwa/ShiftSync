import { clsx } from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "muted";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variant === "default" && "bg-accentMuted text-blue-200",
        variant === "success" && "bg-success/20 text-success",
        variant === "warning" && "bg-warning/20 text-warning",
        variant === "danger" && "bg-danger/20 text-danger",
        variant === "muted" && "bg-border/50 text-muted",
        className
      )}
    >
      {children}
    </span>
  );
}
