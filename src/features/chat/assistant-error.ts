import type { AgentFailure, AssistantMessage } from "./agent-types";

export type AssistantErrorDetails = {
  code: AgentFailure["code"];
  summary: string;
  technicalMessage?: string;
  retryable: boolean;
};

export function assistantErrorDetails(
  message: AssistantMessage,
): AssistantErrorDetails | null {
  if (message.failure) {
    return {
      code: message.failure.code,
      summary: message.failure.message,
      technicalMessage: message.failure.technicalMessage,
      retryable: message.failure.retryable,
    };
  }
  if (message.stopReason !== "error" && !message.errorMessage) return null;
  return {
    code: "MODEL_REQUEST_FAILED",
    summary: "The model request failed.",
    technicalMessage: message.errorMessage,
    retryable: false,
  };
}
