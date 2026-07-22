import path from "node:path";
import { AppError } from "@/server/domain/app-error";
import type { InstructionStore } from "@/server/ports/instruction-store";
import type {
  DeleteInstructionInput,
  WriteInstructionInput,
} from "@/server/ports/instruction-store";
import type { WorkspaceRootProvider } from "@/server/ports/file-system";
import type {
  SystemInstructionsResponse,
  ProjectInstructionsResponse,
} from "@/contracts/instructions";
import { MAX_INSTRUCTION_BYTES } from "@/contracts/instructions";

/**
 * 指令应用服务。
 *
 * 职责：
 * - 校验项目根目录已注册。
 * - 校验内容大小不超过限制。
 * - 委托 InstructionStore 执行文件读写和删除。
 * - 不直接使用 node:fs 或 Pi SDK。
 */
export class InstructionService {
  constructor(
    private readonly store: InstructionStore,
    private readonly roots: WorkspaceRootProvider,
  ) {}

  async getSystem(): Promise<SystemInstructionsResponse> {
    const append = await this.store.readGlobalAppend();
    return { append };
  }

  async saveSystem(
    content: string,
    expectedRevision: string,
    force?: boolean,
  ): Promise<SystemInstructionsResponse> {
    validateContentSize(content);
    const input: WriteInstructionInput = { content, expectedRevision, force };
    const append = await this.store.writeGlobalAppend(input);
    return { append };
  }

  async deleteSystem(
    expectedRevision: string,
    force?: boolean,
  ): Promise<void> {
    const input: DeleteInstructionInput = { expectedRevision, force };
    await this.store.deleteGlobalAppend(input);
  }

  async getProject(cwd: string): Promise<ProjectInstructionsResponse> {
    const root = await this.validateRoot(cwd);
    const project = await this.store.readProject(root);
    return { project };
  }

  async saveProject(
    cwd: string,
    content: string,
    expectedRevision: string,
    force?: boolean,
  ): Promise<ProjectInstructionsResponse> {
    const root = await this.validateRoot(cwd);
    validateContentSize(content);
    const input: WriteInstructionInput = { content, expectedRevision, force };
    const project = await this.store.writeProject(root, input);
    return { project };
  }

  async deleteProject(
    cwd: string,
    expectedRevision: string,
    force?: boolean,
  ): Promise<void> {
    const root = await this.validateRoot(cwd);
    const input: DeleteInstructionInput = { expectedRevision, force };
    await this.store.deleteProject(root, input);
  }

  /**
   * 校验 cwd 对应的项目根目录已注册。
   * 返回规范化后的根目录路径。
   */
  private async validateRoot(cwd: string): Promise<string> {
    if (!cwd || typeof cwd !== "string" || cwd.trim() === "") {
      throw new AppError(
        "VALIDATION_ERROR",
        "Project root (cwd) is required",
        400,
      );
    }
    const roots = await this.roots.listRoots();
    const resolved = path.resolve(cwd);
    const matched = roots.some(
      (root) => path.resolve(root) === resolved,
    );
    if (!matched) {
      throw new AppError(
        "PROJECT_NOT_REGISTERED",
        `Project root ${cwd} is not registered`,
        403,
      );
    }
    return resolved;
  }
}

/** 校验内容大小不超过最大限制。 */
function validateContentSize(content: string): void {
  const byteLength = Buffer.byteLength(content, "utf8");
  if (byteLength > MAX_INSTRUCTION_BYTES) {
    throw new AppError(
      "INSTRUCTION_TOO_LARGE",
      `Instruction content exceeds ${MAX_INSTRUCTION_BYTES} bytes`,
      400,
    );
  }
}
