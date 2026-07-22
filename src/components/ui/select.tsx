"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { mergeClasses } from "@/lib/utils";

function Select(props: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectValue(
  props: React.ComponentProps<typeof SelectPrimitive.Value>,
) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  children,
  density = "compact",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  density?: "default" | "compact";
}) {
  return (
    <SelectPrimitive.Trigger
      className={mergeClasses(
        "flex items-center justify-between gap-2 rounded-control border border-line-strong bg-elevated whitespace-nowrap text-foreground outline-none transition-[color,background-color,border-color,box-shadow] duration-[var(--motion-fast)] hover:bg-subtle disabled:cursor-not-allowed disabled:bg-[var(--disabled-surface)] disabled:text-[var(--disabled-text)] focus-visible:border-ring focus-visible:bg-elevated focus-visible:ring-2 focus-visible:ring-ring [&>span]:truncate [&_svg]:size-3.5 [&_svg]:opacity-60",
        density === "compact"
          ? "h-8 px-2.5 text-xs"
          : "h-9 px-3 text-sm",
        className,
      )}
      data-slot="select-trigger"
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={mergeClasses(
          "relative z-[1000] max-h-80 min-w-[8rem] overflow-hidden rounded-floating border border-line-subtle bg-popover text-popover-foreground shadow-[var(--shadow-floating)]",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          className,
        )}
        data-slot="select-content"
        position={position}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="flex h-7 items-center justify-center">
          <ChevronUp className="size-4" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport
          className={mergeClasses(
            "p-1",
            position === "popper" &&
              "min-w-[var(--radix-select-trigger-width)]",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex h-7 items-center justify-center">
          <ChevronDown className="size-4" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={mergeClasses(
        "relative flex w-full cursor-default items-center rounded-md py-1.5 pr-8 pl-2 text-xs outline-none select-none focus:bg-hover focus:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      data-slot="select-item"
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-3.5" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
};
