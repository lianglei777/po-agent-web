import type {
  InstallSkillPackInput,
  RemoveSkillPackInput,
  SkillPackLoadResult,
} from "@/server/domain/skill-pack";

export interface SkillPackProvider {
  list(cwd: string): Promise<SkillPackLoadResult>;
  install(input: InstallSkillPackInput): Promise<SkillPackLoadResult>;
  remove(input: RemoveSkillPackInput): Promise<SkillPackLoadResult>;
}
