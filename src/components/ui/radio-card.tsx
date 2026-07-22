import * as React from "react";
import { mergeClasses } from "@/lib/utils";

function RadioCard({
  children,
  className,
  ...props
}: React.ComponentProps<"input"> & { children: React.ReactNode }) {
  return (
    <label
      className={mergeClasses(
        "flex cursor-pointer items-center gap-3 rounded-control border border-line-subtle px-3 py-2 text-sm transition-[background-color,border-color,box-shadow] duration-[var(--motion-fast)] hover:bg-subtle has-[:checked]:border-ring has-[:checked]:bg-selected has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
        className,
      )}
    >
      <input className="peer sr-only" type="radio" {...props} />
      <span
        aria-hidden="true"
        className="grid size-4 shrink-0 place-items-center rounded-full border border-line-strong bg-elevated after:size-2 after:rounded-full after:bg-accent after:opacity-0 peer-checked:border-ring peer-checked:after:opacity-100"
      />
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  );
}

export { RadioCard };
