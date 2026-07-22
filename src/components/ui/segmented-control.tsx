"use client";

import { useRef, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { mergeClasses } from "@/lib/utils";

type SegmentedItem<T extends string> = {
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string> = {
  ariaLabel: string;
  className?: string;
  items: Array<SegmentedItem<T>>;
  kind?: "tabs" | "radio";
  onValueChange: (value: T) => void;
  value: T;
};

function SegmentedControl<T extends string>({
  ariaLabel,
  className,
  items,
  kind = "tabs",
  onValueChange,
  value,
}: SegmentedControlProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function moveFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const currentIndex = Math.max(
      0,
      items.findIndex((item) => item.value === value),
    );
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : event.key === "ArrowRight"
            ? (currentIndex + 1) % items.length
            : (currentIndex - 1 + items.length) % items.length;
    const next = items[nextIndex];
    onValueChange(next.value);
    refs.current[nextIndex]?.focus();
  }

  return (
    <div
      aria-label={ariaLabel}
      className={mergeClasses(
        "inline-flex rounded-control border border-line-subtle bg-panel p-1",
        className,
      )}
      onKeyDown={moveFocus}
      role={kind === "tabs" ? "tablist" : "radiogroup"}
    >
      {items.map((item, index) => {
        const selected = item.value === value;
        return (
          <Button
            aria-checked={kind === "radio" ? selected : undefined}
            aria-selected={kind === "tabs" ? selected : undefined}
            className={mergeClasses(
              "h-7 rounded-small-control px-3 text-xs",
              selected
                ? "bg-selected text-primary hover:bg-selected"
                : "text-muted hover:text-primary",
            )}
            key={item.value}
            onClick={() => onValueChange(item.value)}
            ref={(node) => {
              refs.current[index] = node;
            }}
            role={kind === "tabs" ? "tab" : "radio"}
            size="sm"
            tabIndex={selected ? 0 : -1}
            type="button"
            variant="ghost"
          >
            {item.label}
          </Button>
        );
      })}
    </div>
  );
}

export { SegmentedControl };
