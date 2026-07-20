"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { mergeClasses } from "@/lib/utils";

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-dim">
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-muted">{label}</label>
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
      <h2 className="px-0.5 text-[13px] font-semibold text-primary">
        {title}
      </h2>
      <Card className="overflow-hidden rounded-xl border-line-subtle">
        {children}
      </Card>
    </section>
  );
}

export function SettingsRow({
  label,
  description,
  children,
  align = "center",
}: {
  label: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  align?: "center" | "start";
}) {
  return (
    <div
      className={mergeClasses(
        "grid grid-cols-[minmax(170px,0.8fr)_minmax(260px,1.2fr)] gap-6 border-t border-line-subtle px-4 py-3.5 first:border-t-0",
        align === "center" ? "items-center" : "items-start",
      )}
    >
      <div className="min-w-0">
        <div className="text-[12px] font-medium text-primary">{label}</div>
        {description && (
          <p className="mt-1 max-w-[54ch] text-[11px] leading-4 text-dim">
            {description}
          </p>
        )}
      </div>
      <div className="min-w-0 w-full max-w-[460px] justify-self-end">
        {children}
      </div>
    </div>
  );
}

export const controlClassName =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1";

export const inputStyle: React.CSSProperties = {
  padding: "7px 10px",
  background: "var(--bg-panel)",
  border: "1px solid var(--border-strong)",
  borderRadius: 8,
  color: "var(--text)",
  fontSize: 12,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};
