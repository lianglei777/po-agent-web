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
      <Card className="overflow-hidden rounded-xl border-line-subtle bg-elevated">
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
        "grid grid-cols-[minmax(160px,1fr)_minmax(200px,250px)] gap-6 border-t border-line-subtle px-4 py-3.5 first:border-t-0",
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
      <div className="min-w-0 w-full max-w-[250px] justify-self-end">
        {children}
      </div>
    </div>
  );
}

// 边框、背景、圆角通过 Tailwind 类设置，以便支持 hover/focus 状态过渡
export const controlClassName =
  "border border-line-strong bg-elevated rounded-md transition-colors duration-[var(--motion-fast)] hover:border-accent/50 focus-visible:outline-none focus-visible:border-accent focus-visible:bg-accent-soft focus-visible:ring-2 focus-visible:ring-accent/20 focus-visible:ring-offset-1";

export const inputStyle: React.CSSProperties = {
  padding: "7px 10px",
  color: "var(--text)",
  fontSize: 12,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

// 原生 select 样式：隐藏默认箭头，自定义箭头距右边框 10px，与文本左边距保持一致
export const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b9098' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  backgroundSize: "12px",
  paddingRight: "28px",
};
