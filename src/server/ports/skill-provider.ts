import type {
  ImportLocalSkillInput,
  ImportLocalSkillResult,
  InstallSkillInput,
  InstallSkillResult,
  RemoveSkillInput,
  SetSkillInvocationInput,
  SkillLoadResult,
  SkillSearchResult,
} from "@/server/domain/skill";

/**
 * 技能提供者端口。
 *
 * 抽象技能的加载、配置、搜索和安装能力。
 * 具体实现由 infrastructure 层提供，技能存储格式和安装机制不暴露到此接口。
 */
export interface SkillProvider {
  /** 加载指定工作目录下的技能配置。 */
  load(cwd: string): Promise<SkillLoadResult>;
  /** 设置技能的模型调用启用或禁用状态。 */
  setModelInvocationDisabled(
    input: SetSkillInvocationInput,
  ): Promise<SkillLoadResult>;
  /** 搜索可用技能，返回最多 `limit` 条匹配结果。 */
  search(query: string, limit: number): Promise<SkillSearchResult[]>;
  /**
   * 安装技能。
   *
   * 此操作有副作用（会执行安装命令或写入文件），需保留用户反馈和错误状态。
   */
  install(input: InstallSkillInput): Promise<InstallSkillResult>;
  /**
   * 移除已安装的项目级技能。
   *
   * 此操作有副作用（会执行删除命令、清理符号链接、更新 lock 文件），需保留用户反馈和错误状态。
   * 仅支持 project scope 的技能；其他 scope 的技能应在调用前由上层过滤。
   */
  remove(input: RemoveSkillInput): Promise<SkillLoadResult>;
  /**
   * 导入本地 skill 文件。
   *
   * 读取指定路径的 skill 文件，解析 frontmatter 中的 name，复制到
   * .pi/skills/<name>/SKILL.md（项目级）或 ~/.pi/agent/skills/<name>/SKILL.md（全局）。
   * 此操作有副作用（会读取和写入文件），
   * 需保留用户反馈和错误状态。
   */
  importLocal(input: ImportLocalSkillInput): Promise<ImportLocalSkillResult>;
}
