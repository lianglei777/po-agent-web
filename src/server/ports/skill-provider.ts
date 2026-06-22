import type {
  InstallSkillInput,
  InstallSkillResult,
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
}
