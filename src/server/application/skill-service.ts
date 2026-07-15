import type {
  ImportLocalSkillInput,
  InstallSkillInput,
  RemoveSkillInput,
  SetSkillInvocationInput,
} from "@/server/domain/skill";
import type { WorkspaceRootProvider } from "@/server/ports/file-system";
import type { SkillProvider } from "@/server/ports/skill-provider";
import { resolveAllowedCwd } from "./resolve-allowed-cwd";

export class SkillService {
  constructor(
    private readonly skills: SkillProvider,
    private readonly roots: WorkspaceRootProvider,
  ) {}

  async load(cwd: string) {
    return this.skills.load(await resolveAllowedCwd(cwd, this.roots));
  }

  async setModelInvocationDisabled(input: SetSkillInvocationInput) {
    return this.skills.setModelInvocationDisabled({
      ...input,
      cwd: await resolveAllowedCwd(input.cwd, this.roots),
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
          ? await resolveAllowedCwd(input.cwd ?? "", this.roots)
          : input.cwd,
    });
  }

  async remove(input: RemoveSkillInput) {
    return this.skills.remove({
      ...input,
      cwd: await resolveAllowedCwd(input.cwd, this.roots),
    });
  }

  async importLocal(input: ImportLocalSkillInput) {
    return this.skills.importLocal({
      ...input,
      cwd:
        input.scope === "project"
          ? await resolveAllowedCwd(input.cwd ?? "", this.roots)
          : input.cwd,
    });
  }

}
