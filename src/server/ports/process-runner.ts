/**
 * 进程执行器端口。
 *
 * 抽象子进程执行能力，支持设置工作目录、超时、输出上限和环境变量。
 * 具体实现由 infrastructure 层的 Node.js 子进程适配器提供。
 */
export interface ProcessRunner {
  /**
   * 执行外部命令并等待其完成。
   *
   * 返回 stdout 和 stderr 内容。超时或输出超限时应以可预期错误终止。
   */
  run(
    executable: string,
    args: string[],
    options?: {
      /** 子进程工作目录。 */
      cwd?: string;
      /** 执行超时时间（毫秒）。 */
      timeoutMs?: number;
      /** stdout 与 stderr 合计最大输出字节数。 */
      maxOutputBytes?: number;
      /** 子进程环境变量。 */
      env?: Record<string, string | undefined>;
    },
  ): Promise<{
    stdout: string;
    stderr: string;
  }>;
}
