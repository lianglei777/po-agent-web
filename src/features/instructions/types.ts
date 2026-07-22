/** 携带后端错误码的指令请求异常。 */
export class InstructionApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "InstructionApiError";
  }
}
