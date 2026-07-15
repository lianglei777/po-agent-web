import path from "node:path";
import { AppError } from "@/server/domain/app-error";
import type { WorkspaceRootProvider } from "@/server/ports/file-system";

export async function resolveAllowedCwd(
  cwd: string,
  roots: WorkspaceRootProvider,
): Promise<string> {
  if (!cwd.trim()) {
    throw new AppError("VALIDATION_ERROR", "cwd is required", 400);
  }
  const resolved = path.resolve(cwd);
  const allowed = (await roots.listRoots()).some((root) => {
    const relative = path.relative(path.resolve(root), resolved);
    return (
      relative === "" ||
      (!relative.startsWith("..") && !path.isAbsolute(relative))
    );
  });
  if (!allowed) {
    throw new AppError(
      "VALIDATION_ERROR",
      "cwd is not a registered workspace root",
      403,
    );
  }
  return resolved;
}
