import { readFileSync } from "node:fs";
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

/**
 * 读取追加提示词文件内容，文件不存在时返回空字符串。
 * 用于显式组合全局和项目追加来源。
 */
function readAppendFile(filePath: string): string {
  try {
    return readFileSync(filePath, "utf8");
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT"
    ) {
      return "";
    }
    throw error;
  }
}

/**
 * 解析追加提示词来源列表。
 *
 * Pi SDK 默认发现逻辑在项目 `.pi/APPEND_SYSTEM.md` 存在时会遮蔽全局文件。
 * Po Agent 需要全局追加提示词始终生效，因此显式组合：
 *
 * 1. 全局 `<agentDir>/APPEND_SYSTEM.md`
 * 2. 项目 `<cwd>/.pi/APPEND_SYSTEM.md`（如果外部工具已创建）
 *
 * 组合顺序固定为全局在前、项目在后。
 */
function resolveAppendSources(
  agentDir: string,
  cwd: string,
): string[] {
  const globalPath = path.join(agentDir, "APPEND_SYSTEM.md");
  const projectPath = path.join(cwd, ".pi", "APPEND_SYSTEM.md");

  const globalContent = readAppendFile(globalPath);
  const projectContent = readAppendFile(projectPath);

  const sources: string[] = [];
  if (globalContent.trim()) sources.push(globalContent);
  if (projectContent.trim()) sources.push(projectContent);
  return sources;
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
    // 每次 reload 都重新读取文件，确保运行中的会话能发现新增或修改后的提示词。
    appendSystemPrompt: [],
    appendSystemPromptOverride: () => resolveAppendSources(agentDir, cwd),
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
