/**
 * 系统提示词与项目指令的 HTTP 可序列化契约。
 *
 * - `InstructionDocument` 描述一份可编辑指令文件的读取结果。
 * - 保存和删除请求携带 `expectedRevision` 防止静默覆盖。
 * - `force` 仅在用户明确选择覆盖时使用。
 */

/** 指令文件读取结果。 */
export interface InstructionDocument {
  /** 文件文本内容；文件不存在时为空字符串。 */
  content: string;
  /** 文件是否存在于磁盘。 */
  exists: boolean;
  /** 文件绝对路径，用于 UI 展示。 */
  filePath: string;
  /** 文件内容的 SHA-256 指纹；文件不存在时为稳定的 absent revision。 */
  revision: string;
}

/** GET /api/instructions/system 响应。 */
export interface SystemInstructionsResponse {
  append: InstructionDocument;
}

/** GET /api/instructions/project 响应。 */
export interface ProjectInstructionsResponse {
  project: InstructionDocument;
}

/** PUT /api/instructions/system 请求。 */
export interface SaveSystemInstructionsRequest {
  content: string;
  expectedRevision: string;
  force?: boolean;
}

/** DELETE /api/instructions/system 请求。 */
export interface DeleteSystemInstructionsRequest {
  expectedRevision: string;
  force?: boolean;
}

/** PUT /api/instructions/project 请求。 */
export interface SaveProjectInstructionsRequest {
  cwd: string;
  content: string;
  expectedRevision: string;
  force?: boolean;
}

/** DELETE /api/instructions/project 请求。 */
export interface DeleteProjectInstructionsRequest {
  cwd: string;
  expectedRevision: string;
  force?: boolean;
}

/** 指令相关错误码，与 AppErrorCode 保持一致。 */
export const INSTRUCTION_ERROR_CODES = [
  "INSTRUCTION_TOO_LARGE",
  "INSTRUCTION_CONFLICT",
  "PROJECT_NOT_REGISTERED",
  "INSTRUCTION_READ_FAILED",
  "INSTRUCTION_WRITE_FAILED",
  "INSTRUCTION_DELETE_FAILED",
  "AGENT_BUSY",
  "INSTRUCTION_RELOAD_FAILED",
] as const;

export type InstructionErrorCode =
  (typeof INSTRUCTION_ERROR_CODES)[number];

/** 全局追加提示词的最大 UTF-8 字节长度。 */
export const MAX_INSTRUCTION_BYTES = 64 * 1024;

/** AGENTS.md 创建模板。 */
export const AGENTS_MD_TEMPLATE = `# Project Instructions

## Architecture

## Development

## Testing
`;

/** 文件不存在时使用的稳定 absent revision。 */
export const ABSENT_REVISION = "sha256:absent";
