import type {
  SessionContext,
  SessionDetail,
  SessionInfo,
} from "@/server/domain/session";

/**
 * 会话仓储端口。
 *
 * 抽象会话的持久化、查询、重命名、删除和上下文获取能力。
 * 具体实现由 infrastructure 层的 Pi Session 文件适配器提供。
 */
export interface SessionRepository {
  /** 列出所有会话摘要信息。 */
  list(): Promise<SessionInfo[]>;
  /** 根据会话标识查找会话详情；不存在时返回 `null`。 */
  findById(sessionId: string): Promise<SessionDetail | null>;
  /**
   * 获取会话上下文。
   *
   * `leafId` 用于指定上下文的叶子节点；未提供时使用会话当前最新节点。
   */
  getContext(
    sessionId: string,
    leafId?: string | null,
  ): Promise<SessionContext | null>;
  /** 重命名指定会话。 */
  rename(sessionId: string, name: string): Promise<void>;
  /** 删除指定会话并将其子会话重新挂载到父会话。 */
  deleteAndReparent(sessionId: string): Promise<void>;
  /** 解析会话存储路径；会话不存在时返回 `null`。 */
  resolveStoragePath(sessionId: string): Promise<string | null>;
}
