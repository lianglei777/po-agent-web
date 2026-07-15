import type {
  InstallSkillPackSourceRequest,
  InstallSkillPackRequest,
  MaintainSkillPackRequest,
  RemoveSkillPackRequest,
  SkillPackLoadResponse,
} from "@/contracts/skill-packs";

export type InstallSkillPackInput = InstallSkillPackRequest;
export type InstallSkillPackSourceInput = InstallSkillPackSourceRequest;
export type MaintainSkillPackInput = MaintainSkillPackRequest;
export type RemoveSkillPackInput = RemoveSkillPackRequest;
export type SkillPackLoadResult = SkillPackLoadResponse;

export type {
  SkillPackInfo,
  SkillPackResources,
} from "@/contracts/skill-packs";
