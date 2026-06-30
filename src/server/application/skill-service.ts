import path from "node:path";
import { AppError } from "@/server/domain/app-error";
import type {
  InstallSkillInput,
  RemoveSkillInput,
  SetSkillInvocationInput,
} from "@/server/domain/skill";
import type { WorkspaceRootProvider } from "@/server/ports/file-system";
import type { SkillProvider } from "@/server/ports/skill-provider";

export class SkillService {
  constructor(
    private readonly skills: SkillProvider,
    private readonly roots: WorkspaceRootProvider,
  ) {}

  async load(cwd: string) {
    return this.skills.load(await this.resolveAllowedCwd(cwd));
  }

  async setModelInvocationDisabled(input: SetSkillInvocationInput) {
    return this.skills.setModelInvocationDisabled({
      ...input,
      cwd: await this.resolveAllowedCwd(input.cwd),
    });
  }

  search(query: string, limit = 20) {
    return this.skills.search(query, limit);
  }

  async install(input: InstallSkillInput) {
    return this.skills.install({
      ...input,
      cwd:
        input.scope === "project"
          ? await this.resolveAllowedCwd(input.cwd ?? "")
          : input.cwd,
    });
  }

  async remove(input: RemoveSkillInput) {
    return this.skills.remove({
      ...input,
      cwd: await this.resolveAllowedCwd(input.cwd),
    });
  }

  private async resolveAllowedCwd(cwd: string): Promise<string> {
    if (!cwd.trim()) {
      throw new AppError("VALIDATION_ERROR", "cwd is required", 400);
    }
    const resolved = path.resolve(cwd);
    const roots = await this.roots.listRoots();
    const allowed = roots.some((root) => {
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
}
