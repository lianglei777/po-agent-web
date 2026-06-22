import { randomUUID } from "node:crypto";
import type {
  AgentCommand,
  ThinkingLevel,
} from "@/server/domain/agent-command";
import { AppError } from "@/server/domain/app-error";
import type { AgentEvent } from "@/server/domain/agent-event";
import type {
  AgentRuntime,
  AgentRuntimeFactory,
  AgentRuntimeRegistry,
} from "@/server/ports/agent-runtime";
import type { WorkspaceRootProvider } from "@/server/ports/file-system";
import type { SessionRepository } from "@/server/ports/session-repository";

/**
 * 创建 Agent 会话的请求参数。
 */
export interface CreateAgentRequest {
  /** 工作目录 */
  cwd: string;
  /** 模型提供者（可选） */
  provider?: string;
  /** 模型标识（可选） */
  modelId?: string;
  /** 思考级别（可选） */
  thinkingLevel?: ThinkingLevel;
  /** 允许使用的工具名称列表（可选） */
  toolNames?: string[];
}

/**
 * Agent 会话应用服务。
 *
 * 负责协调会话生命周期、命令执行与事件订阅，
 * 是 transport 层与领域/端口之间的用例边界。
 */
export class AgentService {
  /**
   * @param sessions - 会话持久化仓库
   * @param runtimes - Agent 运行时注册表（缓存与保活）
   * @param runtimeFactory - Agent 运行时工厂
   * @param roots - 工作区根目录提供者
   */
  constructor(
    private readonly sessions: SessionRepository,
    private readonly runtimes: AgentRuntimeRegistry,
    private readonly runtimeFactory: AgentRuntimeFactory,
    private readonly roots: WorkspaceRootProvider,
  ) {}

  /**
   * 创建一个新的 Agent 会话。
   *
   * 注册工作区根目录、启动运行时，并按需配置模型、思考级别和工具。
   *
   * @param input - 创建请求参数
   * @returns 包含新会话 ID 的对象
   */
  async create(
    input: CreateAgentRequest,
  ): Promise<{ sessionId: string }> {
    this.roots.addRoot(input.cwd);
    const startKey = `new:${randomUUID()}`;
    const runtime = await this.runtimes.getOrStart(startKey, () =>
      this.runtimeFactory.create({
        cwd: input.cwd,
        toolNames: input.toolNames,
      }),
    );
    if (input.provider && input.modelId) {
      await runtime.execute({
        type: "set_model",
        provider: input.provider,
        modelId: input.modelId,
      });
    }
    if (input.thinkingLevel) {
      await runtime.execute({
        type: "set_thinking_level",
        level: input.thinkingLevel,
      });
    }
    if (input.toolNames) {
      await runtime.execute({ type: "set_tools", toolNames: input.toolNames });
    }
    return { sessionId: runtime.sessionId };
  }

  /**
   * 向指定会话执行一条 Agent 命令。
   *
   * - prompt 命令会进入后台异步执行，立即返回 accepted。
   * - fork 命令会创建新会话并销毁原运行时。
   * - 其他命令直接同步执行。
   *
   * @param sessionId - 目标会话 ID
   * @param command - 要执行的命令
   * @returns 命令执行结果
   */
  async execute<T>(
    sessionId: string,
    command: AgentCommand,
  ): Promise<T> {
    const runtime = await this.getOrRestore(sessionId);
    this.runtimes.touch(sessionId);

    if (command.type === "prompt") {
      this.runInBackground(runtime, command);
      return { accepted: true } as T;
    }
    if (command.type === "fork") {
      const result = await runtime.execute<{
        sessionId: string;
        sessionFile: string;
      }>(command);
      this.runtimes.destroy(sessionId);
      return result as T;
    }
    return runtime.execute<T>(command);
  }

  /**
   * 获取指定会话的运行时加载状态与当前状态。
   *
   * @param sessionId - 会话 ID
   * @returns 加载状态及状态对象；若未加载则只返回 loaded: false
   */
  async getSnapshot(sessionId: string) {
    const runtime = this.runtimes.get(sessionId);
    return runtime
      ? { loaded: true as const, state: await runtime.getState() }
      : { loaded: false as const };
  }

  /**
   * 订阅指定会话的 Agent 事件。
   *
   * 会在订阅期间保持运行时活跃。
   *
   * @param sessionId - 会话 ID
   * @param listener - 事件监听器
   * @returns 取消订阅的清理函数
   */
  async subscribe(
    sessionId: string,
    listener: (event: AgentEvent) => void,
  ): Promise<() => void> {
    const runtime = await this.getOrRestore(sessionId);
    this.runtimes.touch(sessionId);
    return runtime.subscribe((event) => {
      this.runtimes.touch(sessionId);
      listener(event);
    });
  }

  /**
   * 获取内存中的运行时；若不存在则从持久化仓库恢复。
   *
   * @param sessionId - 会话 ID
   * @returns Agent 运行时实例
   * @throws AppError 当会话不存在时抛出 SESSION_NOT_FOUND 错误
   */
  private async getOrRestore(sessionId: string): Promise<AgentRuntime> {
    return this.runtimes.getOrStart(sessionId, async () => {
      const detail = await this.sessions.findById(sessionId);
      if (!detail) {
        throw new AppError(
          "SESSION_NOT_FOUND",
          `Session ${sessionId} was not found`,
          404,
        );
      }
      this.roots.addRoot(detail.info?.cwd ?? process.cwd());
      return this.runtimeFactory.create({
        requestedSessionId: sessionId,
        sessionFile: detail.filePath,
        cwd: detail.info?.cwd ?? process.cwd(),
      });
    });
  }

  /**
   * 在后台执行命令，失败时仅记录错误而不向上抛出。
   *
   * 用于 prompt 等非阻塞命令。
   *
   * @param runtime - 当前运行时
   * @param command - 要执行的命令
   */
  private runInBackground(
    runtime: AgentRuntime,
    command: AgentCommand,
  ): void {
    void runtime.execute(command).catch((error) => {
      console.error(`Agent command ${command.type} failed`, error);
    });
  }
}
