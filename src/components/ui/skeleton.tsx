import { mergeClasses } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={mergeClasses(
        "rounded-md bg-hover motion-safe:animate-pulse",
        className,
      )}
      data-slot="skeleton"
      {...props}
    />
  );
}

export { Skeleton };
