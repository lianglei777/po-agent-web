import { sanitizeCompat } from "@/contracts/model-compat";
import type {
  ModelDiagnosticPatch,
  ModelEntry,
} from "../types";

export function changeCompatValue(
  compat: Record<string, unknown> | undefined,
  key: string,
  value: unknown,
): Record<string, unknown> | undefined {
  const next = { ...(compat ?? {}) };
  if (value === undefined) {
    delete next[key];
  } else {
    next[key] = value;
  }
  return Object.keys(next).length ? next : undefined;
}

export function changeEntryApi<
  T extends { api?: string; compat?: Record<string, unknown> },
>(entry: T, api: string | undefined): T {
  const next = { ...entry, api: api || undefined };
  const compat = sanitizeCompat(api, entry.compat);
  if (compat) {
    next.compat = compat;
  } else {
    delete next.compat;
  }
  return next;
}

export function applyModelDiagnosticPatch(
  model: ModelEntry,
  effectiveApi: string | undefined,
  patch: ModelDiagnosticPatch,
): ModelEntry {
  if (
    patch.scope !== "model" ||
    patch.api !== effectiveApi
  ) {
    return model;
  }
  let compat = model.compat;
  for (const [path, value] of Object.entries(patch.changes)) {
    const match = /^compat\.([A-Za-z0-9_]+)$/.exec(path);
    if (!match) continue;
    compat = changeCompatValue(compat, match[1], value);
  }
  const sanitized = sanitizeCompat(effectiveApi, compat);
  const next = { ...model };
  if (sanitized) {
    next.compat = sanitized;
  } else {
    delete next.compat;
  }
  return next;
}
