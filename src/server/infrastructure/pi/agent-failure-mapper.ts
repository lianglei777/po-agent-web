import type {
  AgentFailure,
  AgentFailureCode,
} from "@/server/domain/agent-failure";

export function mapAgentFailure(input: {
  errorMessage?: string;
  provider?: string;
  model?: string;
}): AgentFailure {
  const raw = input.errorMessage?.trim() || "Unknown model error";
  const code = classify(raw);
  return {
    code,
    message: userMessage(code),
    technicalMessage: redactSecrets(raw),
    provider: input.provider,
    model: input.model,
    retryable:
      code === "MODEL_RATE_LIMITED" ||
      code === "MODEL_TIMEOUT" ||
      code === "MODEL_UNAVAILABLE",
  };
}

function classify(message: string): AgentFailureCode {
  if (
    /unknown variant [`'"]?developer|developer role|unsupported.*developer/i.test(
      message,
    )
  ) {
    return "MODEL_PROTOCOL_ERROR";
  }
  if (/\b(401|403)\b|invalid api key|unauthori[sz]ed|authentication/i.test(message)) {
    return "MODEL_AUTH_FAILED";
  }
  if (/\b429\b|rate limit|too many requests/i.test(message)) {
    return "MODEL_RATE_LIMITED";
  }
  if (/timed? out|timeout/i.test(message)) return "MODEL_TIMEOUT";
  if (/\b(502|503|504)\b|service unavailable|overloaded/i.test(message)) {
    return "MODEL_UNAVAILABLE";
  }
  if (/\b400\b|deserialize|invalid request|unsupported/i.test(message)) {
    return "MODEL_PROTOCOL_ERROR";
  }
  return "MODEL_REQUEST_FAILED";
}

function userMessage(code: AgentFailureCode): string {
  switch (code) {
    case "MODEL_AUTH_FAILED":
      return "The model service rejected the configured credentials.";
    case "MODEL_RATE_LIMITED":
      return "The model service rate limit was reached.";
    case "MODEL_PROTOCOL_ERROR":
      return "The model service rejected the request format.";
    case "MODEL_TIMEOUT":
      return "The model request timed out.";
    case "MODEL_UNAVAILABLE":
      return "The model service is temporarily unavailable.";
    default:
      return "The model request failed.";
  }
}

function redactSecrets(message: string): string {
  return message
    .replace(
      /(authorization\s*:\s*bearer\s+)[^\s,;]+/gi,
      "$1[REDACTED]",
    )
    .replace(
      /((?:api[_-]?key|token|secret)\s*[=:]\s*)[^\s,;]+/gi,
      "$1[REDACTED]",
    );
}
