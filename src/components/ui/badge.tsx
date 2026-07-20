import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { mergeClasses } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-caption font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-line-subtle bg-secondary text-secondary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-muted-foreground",
        success: "border-success/25 bg-success/10 text-success",
        destructive:
          "border-destructive/25 bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      className={mergeClasses(badgeVariants({ variant }), className)}
      data-slot="badge"
      {...props}
    />
  );
}

export { Badge, badgeVariants };
