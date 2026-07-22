import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<"input"> & {
  density?: "default" | "compact";
};

function Input({
  className,
  density = "default",
  type,
  ...props
}: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 rounded-control border border-line-strong bg-elevated outline-none transition-[color,background-color,border-color,box-shadow] duration-[var(--motion-fast)] selection:bg-accent-soft selection:text-primary file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-dim hover:bg-subtle disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[var(--disabled-surface)] disabled:text-[var(--disabled-text)] focus-visible:border-ring focus-visible:bg-elevated focus-visible:ring-2 focus-visible:ring-ring",
        density === "compact"
          ? "h-8 px-2.5 py-1 text-xs"
          : "h-9 px-3 py-1 text-sm",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
