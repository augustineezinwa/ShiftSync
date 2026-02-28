import { clsx } from "clsx";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md";
}

export function Card({ children, className, padding = "md" }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-lg border border-border bg-surfaceElevated",
        padding === "none" && "p-0",
        padding === "sm" && "p-3",
        padding === "md" && "p-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("mb-3 font-medium text-gray-100", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={clsx("text-sm font-semibold text-gray-300", className)}>{children}</h3>;
}
