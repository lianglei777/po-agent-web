import type {
  InstallSkillPackSourceInput,
  InstallSkillPackInput,
  MaintainSkillPackInput,
  RemoveSkillPackInput,
  SkillPackLoadResult,
} from "@/server/domain/skill-pack";

export interface SkillPackProvider {
  list(cwd: string): Promise<SkillPackLoadResult>;
  install(input: InstallSkillPackInput): Promise<SkillPackLoadResult>;
  installSource(input: InstallSkillPackSourceInput): Promise<SkillPackLoadResult>;
  update(input: MaintainSkillPackInput): Promise<SkillPackLoadResult>;
  repair(input: MaintainSkillPackInput): Promise<SkillPackLoadResult>;
  remove(input: RemoveSkillPackInput): Promise<SkillPackLoadResult>;
}
