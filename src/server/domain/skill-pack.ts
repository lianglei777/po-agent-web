import type {
  InstallSkillPackRequest,
  RemoveSkillPackRequest,
  SkillPackLoadResponse,
} from "@/contracts/skill-packs";

export type InstallSkillPackInput = InstallSkillPackRequest;
export type RemoveSkillPackInput = RemoveSkillPackRequest;
export type SkillPackLoadResult = SkillPackLoadResponse;

export type {
  SkillPackInfo,
  SkillPackResources,
} from "@/contracts/skill-packs";
