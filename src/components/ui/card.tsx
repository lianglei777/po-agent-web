import * as React from "react";
import { mergeClasses } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={mergeClasses(
        "rounded-lg border border-line-subtle bg-card text-card-foreground shadow-none",
        className,
      )}
      data-slot="card"
      {...props}
    />
  );
}

function CardContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={mergeClasses("p-5", className)}
      data-slot="card-content"
      {...props}
    />
  );
}

export { Card, CardContent };
