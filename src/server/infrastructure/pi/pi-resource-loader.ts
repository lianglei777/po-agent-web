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
  const existingSourceInfo = new Map(
    loader
      .getSkills()
      .skills.map((skill) => [path.resolve(skill.filePath), skill.sourceInfo]),
  );
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
  // Pi 扩展资源时会重新解析全部 Skill；恢复 reload 阶段已解析出的 Package 来源。
  for (const skill of loader.getSkills().skills) {
    const sourceInfo = existingSourceInfo.get(path.resolve(skill.filePath));
    if (sourceInfo) skill.sourceInfo = sourceInfo;
  }
  return loader;
}
