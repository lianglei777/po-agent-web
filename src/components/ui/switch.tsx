"use client";

import * as React from "react";
import { LoaderCircle } from "lucide-react";
import { mergeClasses } from "@/lib/utils";

type SwitchProps = Omit<React.ComponentProps<"button">, "onChange"> & {
  checked: boolean;
  loading?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

function Switch({
  checked,
  className,
  disabled,
  loading = false,
  onCheckedChange,
  onClick,
  ...props
}: SwitchProps) {
  return (
    <button
      aria-checked={checked}
      aria-busy={loading || undefined}
      className={mergeClasses(
        "group relative h-6 w-11 shrink-0 rounded-full border outline-none transition-colors duration-[var(--motion-fast)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:border-line-subtle disabled:bg-[var(--disabled-surface)]",
        checked ? "border-accent bg-accent" : "border-line-strong bg-subtle",
        className,
      )}
      data-slot="switch"
      disabled={disabled || loading}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onCheckedChange?.(!checked);
      }}
      role="switch"
      type="button"
      {...props}
    >
      <span
        aria-hidden="true"
        className={mergeClasses(
          "absolute top-0.5 left-0.5 flex size-[18px] items-center justify-center rounded-full bg-elevated text-primary transition-transform duration-[var(--motion-standard)] group-disabled:bg-[var(--disabled-text)] motion-reduce:transition-none",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      >
        {loading ? <LoaderCircle className="size-3 animate-spin" /> : null}
      </span>
    </button>
  );
}

export { Switch };
