"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { mergeClasses } from "@/lib/utils";

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-0.5 text-meta font-semibold uppercase tracking-[0.06em] text-dim">
      {children}
    </div>
  );
}

export function SettingsSection({
  title,
  children,
  className,
}: {
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={mergeClasses("flex flex-col gap-2.5", className)}>
      <h2 className="px-0.5 text-body-sm font-semibold text-primary">
        {title}
      </h2>
      <Card className="overflow-hidden rounded-floating border-line-subtle bg-elevated">
        {children}
      </Card>
    </section>
  );
}

export function SettingsRow({
  label,
  labelFor,
  description,
  children,
  align = "center",
  contentMaxWidth = 250,
}: {
  label: ReactNode;
  labelFor?: string;
  description?: ReactNode;
  children: ReactNode;
  align?: "center" | "start";
  contentMaxWidth?: number;
}) {
  return (
    <div
      className={mergeClasses(
        "grid gap-6 border-t border-line-subtle px-4 py-3.5 first:border-t-0",
        align === "center" ? "items-center" : "items-start",
      )}
      style={{
        gridTemplateColumns: `minmax(160px,1fr) minmax(200px,${contentMaxWidth}px)`,
      }}
    >
      <div className="min-w-0">
        {labelFor ? (
          <label className="text-xs font-medium text-primary" htmlFor={labelFor}>
            {label}
          </label>
        ) : (
          <div className="text-xs font-medium text-primary">{label}</div>
        )}
        {description ? (
          <p className="mt-1 max-w-[54ch] text-meta leading-4 text-muted">
            {description}
          </p>
        ) : null}
      </div>
      <div
        className="min-w-0 w-full justify-self-end"
        style={{ maxWidth: contentMaxWidth }}
      >
        {children}
      </div>
    </div>
  );
}
