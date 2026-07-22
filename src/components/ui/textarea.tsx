import * as React from "react";
import { mergeClasses } from "@/lib/utils";

function Textarea({
  className,
  density = "default",
  ...props
}: React.ComponentProps<"textarea"> & {
  density?: "default" | "compact";
}) {
  return (
    <textarea
      className={mergeClasses(
        "flex w-full rounded-control border border-line-strong bg-elevated outline-none transition-[color,background-color,border-color,box-shadow] duration-[var(--motion-fast)] placeholder:text-dim hover:bg-subtle disabled:cursor-not-allowed disabled:bg-[var(--disabled-surface)] disabled:text-[var(--disabled-text)] focus-visible:border-ring focus-visible:bg-elevated focus-visible:ring-2 focus-visible:ring-ring",
        density === "compact"
          ? "min-h-20 px-2.5 py-2 text-xs"
          : "min-h-16 px-3 py-2 text-sm",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className,
      )}
      data-slot="textarea"
      {...props}
    />
  );
}

export { Textarea };
