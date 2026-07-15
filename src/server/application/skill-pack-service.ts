import type {
  InstallSkillPackInput,
  RemoveSkillPackInput,
} from "@/server/domain/skill-pack";
import type { WorkspaceRootProvider } from "@/server/ports/file-system";
import type { SkillPackProvider } from "@/server/ports/skill-pack-provider";
import { resolveAllowedCwd } from "./resolve-allowed-cwd";

export class SkillPackService {
  constructor(
    private readonly skillPacks: SkillPackProvider,
    private readonly roots: WorkspaceRootProvider,
  ) {}

  async list(cwd: string) {
    return this.skillPacks.list(await resolveAllowedCwd(cwd, this.roots));
  }

  async install(input: InstallSkillPackInput) {
    return this.skillPacks.install({
      ...input,
      cwd: await resolveAllowedCwd(input.cwd, this.roots),
    });
  }

  async remove(input: RemoveSkillPackInput) {
    return this.skillPacks.remove({
      ...input,
      cwd: await resolveAllowedCwd(input.cwd, this.roots),
    });
  }
}
