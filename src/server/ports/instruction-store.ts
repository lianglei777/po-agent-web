import type { InstructionDocument } from "@/contracts/instructions";

/** 写入指令文件的输入。 */
export interface WriteInstructionInput {
  content: string;
  expectedRevision: string;
  force?: boolean;
}

/** 删除指令文件的输入。 */
export interface DeleteInstructionInput {
  expectedRevision: string;
  force?: boolean;
}

/**
 * 指令文件存储端口。
 *
 * 实现负责：
 * - 将全局目标固定为 `<agentDir>/APPEND_SYSTEM.md`。
 * - 将项目目标固定为 `<root>/AGENTS.md`。
 * - 计算 SHA-256 revision。
 * - 使用同目录临时文件加 rename 原子写入。
 * - 防止通过符号链接逃逸允许根目录。
 */
export interface InstructionStore {
  /** 读取全局追加提示词文件。 */
  readGlobalAppend(): Promise<InstructionDocument>;

  /** 写入全局追加提示词文件。 */
  writeGlobalAppend(input: WriteInstructionInput): Promise<InstructionDocument>;

  /** 删除全局追加提示词文件。 */
  deleteGlobalAppend(input: DeleteInstructionInput): Promise<void>;

  /** 读取项目 AGENTS.md 文件。 */
  readProject(root: string): Promise<InstructionDocument>;

  /** 写入项目 AGENTS.md 文件。 */
  writeProject(
    root: string,
    input: WriteInstructionInput,
  ): Promise<InstructionDocument>;

  /** 删除项目 AGENTS.md 文件。 */
  deleteProject(root: string, input: DeleteInstructionInput): Promise<void>;
}
