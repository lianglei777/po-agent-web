import type { Dictionary } from "@/i18n/dictionary";
import type { SkillInfo, SkillPackInfo } from "./types";

export interface SkillGroup {
  id: string;
  scope: SkillInfo["sourceInfo"]["scope"];
  detail: string;
  origin: SkillInfo["sourceInfo"]["origin"];
  skills: SkillInfo[];
}

export function isManagedSkill(skill: SkillInfo): boolean {
  return skill.sourceInfo.origin === "package";
}

export function findOwningSkillPack(
  skill: SkillInfo,
  packs: SkillPackInfo[],
): SkillPackInfo | undefined {
  if (!isManagedSkill(skill)) return undefined;

  return packs.find((pack) => {
    if (pack.scope === null) return false;
    if (pack.source === skill.sourceInfo.source) return true;
    if (!skill.sourceInfo.baseDir) return false;
    return comparablePath(pack.source) === comparablePath(skill.sourceInfo.baseDir);
  });
}

export function groupSkills(skills: SkillInfo[]): SkillGroup[] {
  const groups = new Map<string, SkillGroup>();
  for (const skill of skills) {
    const id = groupId(skill);
    const group = groups.get(id) ?? {
      id,
      scope: skill.sourceInfo.scope,
      detail: skill.sourceInfo.source,
      origin: skill.sourceInfo.origin,
      skills: [],
    };
    group.skills.push(skill);
    groups.set(id, group);
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      skills: [...group.skills].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    }))
    .sort((a, b) => groupRank(a.id) - groupRank(b.id));
}

export function reconcileSelectedSkill(
  skills: SkillInfo[],
  selectedSkillId: string | null,
): string | null {
  if (
    selectedSkillId &&
    skills.some((skill) => skill.skillId === selectedSkillId)
  ) {
    return selectedSkillId;
  }
  return skills[0]?.skillId ?? null;
}

export function reconcileSelectedSkillPack(
  packs: SkillPackInfo[],
  selectedPackId: string | null,
): string | null {
  if (
    selectedPackId &&
    packs.some((pack) => pack.packId === selectedPackId)
  ) {
    return selectedPackId;
  }
  return packs[0]?.packId ?? null;
}

export function packageSourceLabel(source: string): string {
  if (source.startsWith("npm:")) return source.slice("npm:".length);

  const normalized = source.replaceAll("\\", "/").replace(/\/+$/, "");
  return normalized.split("/").at(-1) || source;
}

function groupId(skill: SkillInfo): string {
  if (skill.sourceInfo.source === "po-agent-builtin") return "builtin";
  if (isManagedSkill(skill)) return `package:${skill.sourceInfo.source}`;
  if (skill.sourceInfo.scope === "project") return "project";
  if (skill.sourceInfo.scope === "user") return "global";
  return `path:${skill.sourceInfo.source}`;
}

function groupRank(id: string): number {
  if (id === "builtin") return 0;
  if (id === "project") return 1;
  if (id === "global") return 2;
  if (id.startsWith("package:")) return 3;
  return 4;
}

function comparablePath(value: string): string {
  const normalized = value.replaceAll("\\", "/").replace(/\/+$/, "");
  return /^[a-z]:\//i.test(normalized) ? normalized.toLowerCase() : normalized;
}

// 将技能来源的内部标识映射为用户可读的标签
export function sourceLabel(
  source: string,
  origin: SkillInfo["sourceInfo"]["origin"],
  t: Dictionary["skills"],
): string {
  // 包安装来源保留原始包名 / git URL，信息量更高
  if (origin === "package") return source;
  if (source === "local") return t.sourceLocal;
  if (source === "auto") return t.sourceAuto;
  if (source === "cli") return t.sourceCli;
  // 兜底：保留原始值（如临时路径分组的自定义来源标识）
  return source;
}
