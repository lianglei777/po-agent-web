"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export function ModalOverlay({
  children,
  zIndex = 1000,
  label,
}: {
  children: ReactNode;
  zIndex?: number;
  label: string;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.35)", zIndex }}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      {children}
    </div>,
    document.body,
  );
}
