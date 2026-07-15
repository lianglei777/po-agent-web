import path from "node:path";
import { AppError } from "@/server/domain/app-error";

const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/;
const NPM_SOURCE = /^(?:npm:)?(?:@[a-z\d][a-z\d._-]*\/[a-z\d][a-z\d._-]*|[a-z\d][a-z\d._-]*)(?:@[^\s?#]+)?$/i;
const SCP_GIT_SOURCE = /^[a-z\d._-]+@[a-z\d.-]+:[^\s?#]+$/i;
const ALLOWED_PROTOCOLS = new Set([
  "http:",
  "https:",
  "git:",
  "ssh:",
  "git+http:",
  "git+https:",
  "git+ssh:",
]);

export function normalizeManualPackageSource(source: string): string {
  const normalized = source.trim();
  if (!normalized || CONTROL_CHARACTER.test(source)) {
    invalidSource();
  }
  if (path.isAbsolute(normalized)) return path.resolve(normalized);
  if (normalized.startsWith("./") || normalized.startsWith("../")) {
    invalidSource();
  }
  if (SCP_GIT_SOURCE.test(normalized)) return normalized;
  if (NPM_SOURCE.test(normalized)) return normalized;

  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    invalidSource();
  }
  if (
    !ALLOWED_PROTOCOLS.has(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    invalidSource();
  }
  return normalized;
}

export function safePackageSource(source: string): string {
  const urlStart = source.search(/[a-z][a-z\d+.-]*:\/\//i);
  if (urlStart < 0) return source;

  try {
    const prefix = source.slice(0, urlStart);
    const url = new URL(source.slice(urlStart));
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return `${prefix}${url.toString()}`;
  } catch {
    return source.slice(0, urlStart);
  }
}

export function isLocalPackageSource(source: string): boolean {
  return path.isAbsolute(source);
}

export function canUpdatePackageSource(source: string): boolean {
  return !isLocalPackageSource(source) && !/^(?:\.\.?)[\\/]/.test(source);
}

function invalidSource(): never {
  throw new AppError(
    "VALIDATION_ERROR",
    "Package source must be an npm reference, an explicit Git URL, or an absolute local directory without credentials, query, or fragment.",
    400,
  );
}
