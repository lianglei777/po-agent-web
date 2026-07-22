import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { AppError } from "@/server/domain/app-error";
import type { InstructionStore } from "@/server/ports/instruction-store";
import type {
  DeleteInstructionInput,
  WriteInstructionInput,
} from "@/server/ports/instruction-store";
import {
  ABSENT_REVISION,
  type InstructionDocument,
  MAX_INSTRUCTION_BYTES,
} from "@/contracts/instructions";

/** 文件不存在时使用的稳定 absent revision。 */
const GLOBAL_APPEND_FILENAME = "APPEND_SYSTEM.md";
const PROJECT_INSTRUCTIONS_FILENAME = "AGENTS.md";

/**
 * 基于 Node.js 文件系统的指令存储实现。
 *
 * - 全局目标固定为 `<agentDir>/APPEND_SYSTEM.md`。
 * - 项目目标固定为 `<root>/AGENTS.md`。
 * - 使用 SHA-256 计算文件内容 revision。
 * - 使用同目录临时文件加 rename 实现原子写入。
 * - 防止通过符号链接逃逸允许根目录。
 */
export class NodeInstructionStore implements InstructionStore {
  private readonly agentDir: string;

  constructor(agentDir: string) {
    this.agentDir = path.resolve(agentDir);
  }

  async readGlobalAppend(): Promise<InstructionDocument> {
    const filePath = path.join(this.agentDir, GLOBAL_APPEND_FILENAME);
    return this.readFile(filePath, this.agentDir);
  }

  async writeGlobalAppend(
    input: WriteInstructionInput,
  ): Promise<InstructionDocument> {
    const filePath = path.join(this.agentDir, GLOBAL_APPEND_FILENAME);
    return this.writeFile(filePath, this.agentDir, input);
  }

  async deleteGlobalAppend(input: DeleteInstructionInput): Promise<void> {
    const filePath = path.join(this.agentDir, GLOBAL_APPEND_FILENAME);
    return this.deleteFile(filePath, this.agentDir, input);
  }

  async readProject(root: string): Promise<InstructionDocument> {
    const filePath = path.join(root, PROJECT_INSTRUCTIONS_FILENAME);
    return this.readFile(filePath, root);
  }

  async writeProject(
    root: string,
    input: WriteInstructionInput,
  ): Promise<InstructionDocument> {
    const filePath = path.join(root, PROJECT_INSTRUCTIONS_FILENAME);
    return this.writeFile(filePath, root, input);
  }

  async deleteProject(
    root: string,
    input: DeleteInstructionInput,
  ): Promise<void> {
    const filePath = path.join(root, PROJECT_INSTRUCTIONS_FILENAME);
    return this.deleteFile(filePath, root, input);
  }

  private async readFile(filePath: string, allowedRoot: string): Promise<InstructionDocument> {
    try {
      const realPath = await fs.realpath(filePath);
      await assertInsideRoot(realPath, allowedRoot);
      const content = await fs.readFile(realPath, "utf8");
      return {
        content,
        exists: true,
        filePath: realPath,
        revision: computeRevision(content),
      };
    } catch (error) {
      if (isNotFound(error)) {
        return {
          content: "",
          exists: false,
          filePath: path.resolve(filePath),
          revision: ABSENT_REVISION,
        };
      }
      if (error instanceof AppError) throw error;
      throw new AppError(
        "INSTRUCTION_READ_FAILED",
        "Failed to read instruction file",
        500,
      );
    }
  }

  private async writeFile(
    filePath: string,
    allowedRoot: string,
    input: WriteInstructionInput,
  ): Promise<InstructionDocument> {
    validateContentSize(input.content);

    // 读取当前文件状态以校验 revision
    const current = await this.readFile(filePath, allowedRoot);
    if (!input.force && current.revision !== input.expectedRevision) {
      throw new AppError(
        "INSTRUCTION_CONFLICT",
        "Instruction file has been modified by another process",
        409,
      );
    }

    // 确保父目录存在
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // 原子写入：先写临时文件，再 rename
    const tempPath = path.join(dir, `.${path.basename(filePath)}.${Date.now()}.tmp`);
    try {
      await fs.writeFile(tempPath, input.content, "utf8");
      await fs.rename(tempPath, filePath);
    } catch {
      // 清理临时文件
      try {
        await fs.unlink(tempPath);
      } catch {
        // 忽略清理失败
      }
      throw new AppError(
        "INSTRUCTION_WRITE_FAILED",
        "Failed to write instruction file",
        500,
      );
    }

    const realPath = await fs.realpath(filePath);
    return {
      content: input.content,
      exists: true,
      filePath: realPath,
      revision: computeRevision(input.content),
    };
  }

  private async deleteFile(
    filePath: string,
    allowedRoot: string,
    input: DeleteInstructionInput,
  ): Promise<void> {
    const current = await this.readFile(filePath, allowedRoot);
    if (!current.exists) {
      // 文件不存在时视为已删除
      return;
    }

    if (!input.force && current.revision !== input.expectedRevision) {
      throw new AppError(
        "INSTRUCTION_CONFLICT",
        "Instruction file has been modified by another process",
        409,
      );
    }

    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (isNotFound(error)) {
        return;
      }
      throw new AppError(
        "INSTRUCTION_DELETE_FAILED",
        "Failed to delete instruction file",
        500,
      );
    }
  }
}

/** 校验真实文件路径仍位于允许的根目录内。 */
async function assertInsideRoot(realPath: string, allowedRoot: string): Promise<void> {
  const realRoot = await fs.realpath(allowedRoot);
  const relative = path.relative(realRoot, realPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Instruction file resolves outside the configured workspace root",
      403,
    );
  }
}

/** 计算文件内容的 SHA-256 revision。 */
function computeRevision(content: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(content, "utf8");
  return `sha256:${hash.digest("hex")}`;
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

/** 判断错误是否为文件不存在。 */
function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "ENOENT"
  );
}
