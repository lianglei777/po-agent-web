export type AgentFailureCode =
  | "MODEL_REQUEST_FAILED"
  | "MODEL_AUTH_FAILED"
  | "MODEL_RATE_LIMITED"
  | "MODEL_PROTOCOL_ERROR"
  | "MODEL_TIMEOUT"
  | "MODEL_UNAVAILABLE"
  | "UNKNOWN_AGENT_ERROR";

export interface AgentFailure {
  code: AgentFailureCode;
  message: string;
  technicalMessage?: string;
  provider?: string;
  model?: string;
  retryable: boolean;
}
