import * as React from "react";
import { ChevronDown } from "lucide-react";
import { mergeClasses } from "@/lib/utils";

type NativeSelectProps = React.ComponentProps<"select"> & {
  density?: "default" | "compact";
  wrapperClassName?: string;
};

function NativeSelect({
  className,
  density = "compact",
  wrapperClassName,
  children,
  ...props
}: NativeSelectProps) {
  return (
    <div className={mergeClasses("relative w-full", wrapperClassName)}>
      <select
        className={mergeClasses(
          "w-full appearance-none rounded-control border border-line-strong bg-elevated pr-8 text-foreground outline-none transition-[color,background-color,border-color,box-shadow] duration-[var(--motion-fast)] hover:bg-subtle disabled:cursor-not-allowed disabled:bg-[var(--disabled-surface)] disabled:text-[var(--disabled-text)] focus-visible:border-ring focus-visible:bg-elevated focus-visible:ring-2 focus-visible:ring-ring",
          density === "compact"
            ? "h-8 px-2.5 text-xs"
            : "h-9 px-3 text-sm",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
          className,
        )}
        data-slot="native-select"
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-dim"
      />
    </div>
  );
}

export { NativeSelect };
