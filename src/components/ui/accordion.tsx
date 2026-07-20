"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { mergeClasses } from "@/lib/utils";

function Accordion(
  props: React.ComponentProps<typeof AccordionPrimitive.Root>,
) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={mergeClasses(
        "overflow-hidden rounded-2xl border border-line-subtle bg-[var(--tool-bg)]",
        className,
      )}
      data-slot="accordion-item"
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={mergeClasses(
          "flex min-h-9 flex-1 cursor-pointer items-center gap-2 px-3 py-2 text-left font-ui-mono text-meta text-muted-foreground outline-none transition-colors duration-[var(--motion-fast)] hover:bg-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&[data-state=open]>svg]:rotate-180",
          className,
        )}
        data-slot="accordion-trigger"
        {...props}
      >
        {children}
        <ChevronDown className="ml-auto size-3.5 shrink-0 transition-transform duration-[var(--motion-standard)]" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      data-slot="accordion-content"
      {...props}
    >
      <div
        className={mergeClasses(
          "border-t border-line-subtle px-3 py-2.5 font-ui-mono text-meta leading-[1.65] whitespace-pre-wrap text-muted-foreground",
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}

export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
};
