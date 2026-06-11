import type {
  InstallSkillInput,
  InstallSkillResult,
  SetSkillInvocationInput,
  SkillLoadResult,
  SkillSearchResult,
} from "@/server/domain/skill";

export interface SkillProvider {
  load(cwd: string): Promise<SkillLoadResult>;
  setModelInvocationDisabled(
    input: SetSkillInvocationInput,
  ): Promise<SkillLoadResult>;
  search(query: string, limit: number): Promise<SkillSearchResult[]>;
  install(input: InstallSkillInput): Promise<InstallSkillResult>;
}
