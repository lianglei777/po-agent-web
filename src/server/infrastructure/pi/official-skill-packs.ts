export interface OfficialSkillPackDefinition {
  id: string;
  version?: string;
  source: string;
  name: string;
  description: string;
  expectedSkills: string[];
  containsExtensions: boolean;
}

export function getOfficialSkillPacks(): OfficialSkillPackDefinition[] {
  return [];
}
