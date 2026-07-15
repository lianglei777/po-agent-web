import path from "node:path";
import { resolveBuiltinSkillsDir } from "./pi-resource-loader";

export interface OfficialSkillPackDefinition {
  id: string;
  source: string;
  name: string;
  description: string;
  expectedSkills: string[];
  containsExtensions: boolean;
}

export function getOfficialSkillPacks(): OfficialSkillPackDefinition[] {
  const resourcesDir = path.dirname(resolveBuiltinSkillsDir());
  return [
    {
      id: "developer-workflows",
      source: path.join(
        resourcesDir,
        "official-packs",
        "developer-workflows",
      ),
      name: "Developer Workflows",
      description:
        "Focused workflows for investigating failures and preparing safe changes.",
      expectedSkills: ["investigate-failure", "prepare-change"],
      containsExtensions: false,
    },
  ];
}
