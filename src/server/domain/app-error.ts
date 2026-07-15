export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "SESSION_NOT_FOUND"
  | "FILE_NOT_FOUND"
  | "NOT_A_FILE"
  | "NOT_A_DIRECTORY"
  | "FILE_TOO_LARGE"
  | "MODEL_NOT_FOUND"
  | "UNSUPPORTED_COMMAND"
  | "COMPACTION_NOT_AVAILABLE"
  | "OAUTH_PROVIDER_NOT_FOUND"
  | "PENDING_INPUT_NOT_FOUND"
  | "SKILL_NOT_FOUND"
  | "SKILL_CONFLICT"
  | "SKILL_SEARCH_FAILED"
  | "SKILL_INSTALL_BUSY"
  | "SKILL_INSTALL_FAILED"
  | "SKILL_REMOVE_BUSY"
  | "SKILL_REMOVE_FAILED"
  | "SKILL_CREATE_FAILED"
  | "SKILL_PACK_NOT_FOUND"
  | "SKILL_PACK_INSTALL_BUSY"
  | "SKILL_PACK_INSTALL_FAILED"
  | "SKILL_PACK_UPDATE_FAILED"
  | "SKILL_PACK_REPAIR_FAILED"
  | "SKILL_PACK_REMOVE_FAILED"
  | "SKILL_PACK_BROKEN"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}
