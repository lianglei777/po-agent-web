/**
 * 待处理输入提供者端口。
 *
 * 管理 Agent 运行过程中需要外部输入的请求。当 Agent 需要用户提供额外信息时，
 * 通过此端口创建一个待处理请求，等待外部解析或拒绝。
 */
export interface PendingInputProvider {
  /**
   * 创建一个待处理输入请求。
   *
   * 返回的 token 用于后续解析，promise 在被 `resolve` 或 `rejectProvider` 后触发。
   * 可通过 signal 取消等待。
   */
  create(
    provider: string,
    signal?: AbortSignal,
  ): { token: string; promise: Promise<string> };
  /** 使用指定 token 解析待处理输入请求，提供用户输入的值。 */
  resolve(token: string, provider: string, value: string): void;
  /** 拒绝指定提供者的所有待处理请求，通常用于清理或错误场景。 */
  rejectProvider(provider: string, reason: Error): void;
}
