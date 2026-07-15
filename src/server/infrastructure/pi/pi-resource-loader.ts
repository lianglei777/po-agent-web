import path from "node:path";
import {
  DefaultResourceLoader,
  getAgentDir,
  SettingsManager,
} from "@earendil-works/pi-coding-agent";

export const BUILTIN_SKILL_SOURCE = "po-agent-builtin";

export function resolveBuiltinSkillsDir(
  env: NodeJS.ProcessEnv = process.env,
  cwd = process.cwd(),
): string {
  return path.resolve(
    env.PO_AGENT_BUILTIN_SKILLS_DIR ??
      path.join(cwd, "resources", "builtin-skills"),
  );
}

export async function createPiResourceLoader({
  cwd,
  agentDir = getAgentDir(),
  builtinSkillsDir = resolveBuiltinSkillsDir(),
}: {
  cwd: string;
  agentDir?: string;
  builtinSkillsDir?: string;
}): Promise<DefaultResourceLoader> {
  const loader = new DefaultResourceLoader({
    cwd,
    agentDir,
    settingsManager: SettingsManager.create(cwd, agentDir),
  });
  await loader.reload();
  loader.extendResources({
    skillPaths: [
      {
        path: builtinSkillsDir,
        metadata: {
          source: BUILTIN_SKILL_SOURCE,
          scope: "temporary",
          origin: "top-level",
        },
      },
    ],
  });
  return loader;
}
