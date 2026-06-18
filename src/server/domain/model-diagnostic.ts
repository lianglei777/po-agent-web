export type ModelDiagnosticCode =
  | "MODEL_AUTH_FAILED"
  | "MODEL_NOT_FOUND"
  | "MODEL_RATE_LIMITED"
  | "MODEL_TIMEOUT"
  | "MODEL_UNAVAILABLE"
  | "MODEL_PROTOCOL_ERROR"
  | "MODEL_RESPONSE_INVALID"
  | "MODEL_REQUEST_FAILED"
  | "UNKNOWN_MODEL_ERROR";

export interface ModelDiagnosticPatch {
  scope: "provider" | "model";
  api: string;
  changes: Record<string, unknown>;
  reason: string;
}

export interface ModelDiagnostic {
  code: ModelDiagnosticCode;
  summary: string;
  technicalMessage?: string;
  provider?: string;
  model?: string;
  retryable: boolean;
  suggestedPatch?: ModelDiagnosticPatch;
}
