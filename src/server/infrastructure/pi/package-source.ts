import path from "node:path";
import { AppError } from "@/server/domain/app-error";

const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/;
const NPM_SOURCE = /^npm:(?:@[a-z\d][a-z\d._-]*\/[a-z\d][a-z\d._-]*|[a-z\d][a-z\d._-]*)(?:@[a-z\d*<>=~^|._+-]+)?$/i;
const PREFIXED_SCP_GIT_SOURCE = /^git:git@[a-z\d.-]+:[^\s?#]+$/i;
const PREFIXED_SHORTHAND_GIT_SOURCE = /^git:[a-z\d.-]+\/[a-z\d._/-]+(?:@[^\s?#]+)?$/i;
const ALLOWED_PROTOCOLS = new Set([
  "http:",
  "https:",
  "git:",
  "ssh:",
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
  if (NPM_SOURCE.test(normalized)) return normalized;
  if (
    PREFIXED_SCP_GIT_SOURCE.test(normalized) ||
    PREFIXED_SHORTHAND_GIT_SOURCE.test(normalized)
  ) {
    return normalized;
  }
  if (normalized.startsWith("git:")) {
    validateRemoteUrl(normalized.slice("git:".length));
    return normalized;
  }

  validateRemoteUrl(normalized);
  return normalized;
}

function validateRemoteUrl(source: string): void {
  let url: URL;
  try {
    url = new URL(source);
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
}

export function safePackageSource(source: string): string {
  const scp = source.match(/^(?:git:)?[^@\s]+@([^:\s]+):(.+)$/);
  if (scp) return `${source.startsWith("git:") ? "git:" : ""}${scp[1]}:${scp[2]}`;

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
  return packageSourceIdentity(source) !== undefined;
}

export function packageSourceIdentity(source: string): string | undefined {
  const normalized = source.trim();
  if (normalized.startsWith("npm:")) {
    const spec = normalized.slice("npm:".length);
    const match = spec.match(/^(@?[^@]+(?:\/[^@]+)?)(?:@.+)?$/);
    return match?.[1] ? `npm:${match[1]}` : undefined;
  }

  const hasGitPrefix = normalized.startsWith("git:");
  const git = hasGitPrefix ? normalized.slice("git:".length) : normalized;
  const scp = hasGitPrefix ? git.match(/^git@([^:]+):(.+)$/) : null;
  if (scp) return gitIdentity(scp[1] ?? "", scp[2] ?? "");

  if (/^(?:https?|ssh|git):\/\//i.test(git)) {
    try {
      const url = new URL(git);
      return gitIdentity(url.hostname, url.pathname);
    } catch {
      return undefined;
    }
  }

  if (hasGitPrefix) {
    const slash = git.indexOf("/");
    if (slash > 0) {
      const first = git.slice(0, slash);
      return first.includes(".") || first === "localhost"
        ? gitIdentity(first, git.slice(slash + 1))
        : gitIdentity("github.com", git);
    }
  }
  return undefined;
}

function gitIdentity(host: string, rawPath: string): string | undefined {
  const pathWithoutRef = rawPath.replace(/^\/+/, "").split("@", 1)[0] ?? "";
  const normalizedPath = pathWithoutRef.replace(/\.git$/i, "");
  if (!host || normalizedPath.split("/").length < 2) return undefined;
  return `git:${host.toLowerCase()}/${normalizedPath}`;
}

function invalidSource(): never {
  throw new AppError(
    "VALIDATION_ERROR",
    "Package source must be an npm reference, an explicit Git URL, or an absolute local directory without credentials, query, or fragment.",
    400,
  );
}
