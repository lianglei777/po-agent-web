import type {
  CreateLocalSkillResponse,
  InstallSkillResponse,
  RemoveSkillRequest,
  SetSkillInvocationRequest,
  SkillLoadResponse,
} from "@/contracts/skills";

export type {
  SkillDiagnostic,
  SkillInfo,
  SkillSearchResult,
} from "@/contracts/skills";

export interface InstallSkillInput {
  packageSpec: string;
  scope: "global" | "project";
  cwd?: string;
}

export type RemoveSkillInput = RemoveSkillRequest;
export type InstallSkillResult = InstallSkillResponse;
export type SetSkillInvocationInput = SetSkillInvocationRequest;
export type SkillLoadResult = SkillLoadResponse;

export interface ImportLocalSkillInput {
  /** 要导入的源 skill 文件的绝对路径 */
  sourceFilePath: string;
  scope: "global" | "project";
  cwd?: string;
}

export type ImportLocalSkillResult = CreateLocalSkillResponse;
