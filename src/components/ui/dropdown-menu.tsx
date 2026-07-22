"use client";

import * as React from "react";
import { Check, ChevronRight, Circle } from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { mergeClasses } from "@/lib/utils";

function DropdownMenu(
  props: React.ComponentProps<typeof DropdownMenuPrimitive.Root>,
) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuTrigger(
  props: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>,
) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  );
}

function DropdownMenuContent({
  align = "start",
  className,
  collisionPadding = 8,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        className={mergeClasses(
          "z-[1000] max-h-[var(--radix-dropdown-menu-content-available-height)] w-max min-w-32 max-w-[min(20rem,var(--radix-dropdown-menu-content-available-width))] overflow-x-hidden overflow-y-auto rounded-floating border border-line-subtle bg-popover p-1 text-popover-foreground shadow-[var(--shadow-floating)]",
          className,
        )}
        collisionPadding={collisionPadding}
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuItem({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.Item
      className={mergeClasses(
        "relative flex min-w-0 max-w-full cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-xs break-words outline-none select-none focus:bg-hover focus:text-foreground data-[highlighted]:bg-hover data-[highlighted]:text-foreground data-[disabled]:pointer-events-none data-[disabled]:text-[var(--disabled-text)] data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        inset && "pl-8",
        className,
      )}
      data-slot="dropdown-menu-item"
      {...props}
    />
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.Label
      className={mergeClasses(
        "px-2 py-1.5 text-caption font-semibold tracking-wide text-muted-foreground uppercase",
        inset && "pl-8",
        className,
      )}
      data-slot="dropdown-menu-label"
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      className={mergeClasses("-mx-1 my-1 h-px bg-border", className)}
      data-slot="dropdown-menu-separator"
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      checked={checked}
      className={mergeClasses(
        "relative flex min-w-0 max-w-full cursor-default items-center gap-2 rounded-md py-1.5 pr-2 pl-8 text-xs break-words outline-none select-none focus:bg-hover focus:text-foreground data-[highlighted]:bg-hover data-[highlighted]:text-foreground data-[disabled]:pointer-events-none data-[disabled]:text-[var(--disabled-text)] data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      data-slot="dropdown-menu-checkbox-item"
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="size-3.5" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup(
  props: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>,
) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      className={mergeClasses(
        "relative flex min-w-0 max-w-full cursor-default items-center gap-2 rounded-md py-1.5 pr-2 pl-8 text-xs break-words outline-none select-none focus:bg-hover focus:text-foreground data-[highlighted]:bg-hover data-[highlighted]:text-foreground data-[disabled]:pointer-events-none data-[disabled]:text-[var(--disabled-text)] data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      data-slot="dropdown-menu-radio-item"
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

function DropdownMenuSub(
  props: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>,
) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      className={mergeClasses(
        "flex min-w-0 max-w-full cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-xs break-words outline-none select-none focus:bg-hover data-[highlighted]:bg-hover data-[state=open]:bg-hover data-[disabled]:pointer-events-none data-[disabled]:text-[var(--disabled-text)] data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        inset && "pl-8",
        className,
      )}
      data-slot="dropdown-menu-sub-trigger"
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto size-3.5 opacity-60" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  collisionPadding = 8,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      className={mergeClasses(
        "z-[1000] max-h-[var(--radix-dropdown-menu-content-available-height)] w-max min-w-32 max-w-[min(20rem,var(--radix-dropdown-menu-content-available-width))] overflow-x-hidden overflow-y-auto rounded-floating border border-line-subtle bg-popover p-1 text-popover-foreground shadow-[var(--shadow-floating)]",
        className,
      )}
      collisionPadding={collisionPadding}
      data-slot="dropdown-menu-sub-content"
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
