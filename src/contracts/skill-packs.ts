export type SkillPackStatus = "available" | "installed" | "broken";
export type SkillPackScope = "user" | "project" | null;

export interface SkillPackResources {
  skills: string[];
  extensions: string[];
  prompts: string[];
  themes: string[];
}

export interface SkillPackInfo {
  packId: string;
  catalogId?: string;
  name: string;
  description: string;
  source: string;
  scope: SkillPackScope;
  status: SkillPackStatus;
  version?: string;
  availableVersion?: string;
  updateAvailable: boolean;
  canUpdate: boolean;
  resources: SkillPackResources;
  containsExtensions: boolean;
}

export interface SkillPackLoadResponse {
  packs: SkillPackInfo[];
}

export interface InstallSkillPackRequest {
  packId: string;
  scope: "global" | "project";
  cwd: string;
}

export interface RemoveSkillPackRequest {
  packId: string;
  cwd: string;
}

export interface InstallSkillPackSourceRequest {
  source: string;
  scope: "global" | "project";
  cwd: string;
}

export interface MaintainSkillPackRequest {
  packId: string;
  cwd: string;
}
