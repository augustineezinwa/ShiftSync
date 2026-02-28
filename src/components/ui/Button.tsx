import { clsx } from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  children: React.ReactNode;
  className?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "rounded-md font-medium transition-colors disabled:opacity-50",
        size === "sm" && "px-2.5 py-1.5 text-xs",
        size === "md" && "px-3 py-2 text-sm",
        variant === "primary" && "bg-accent text-white hover:bg-blue-600",
        variant === "secondary" && "border border-border bg-surfaceElevated text-gray-200 hover:bg-[#243044]",
        variant === "ghost" && "text-muted hover:bg-surfaceElevated hover:text-gray-200",
        variant === "danger" && "bg-danger/20 text-danger hover:bg-danger/30",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
