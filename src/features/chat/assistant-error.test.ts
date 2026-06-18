import { describe, expect, it } from "vitest";
import { assistantErrorDetails } from "./assistant-error";

describe("assistantErrorDetails", () => {
  it("uses structured failures when available", () => {
    expect(
      assistantErrorDetails({
        role: "assistant",
        provider: "custom",
        model: "deepseek-v4-pro",
        content: [],
        stopReason: "error",
        errorMessage: "raw error",
        failure: {
          code: "MODEL_PROTOCOL_ERROR",
          message: "The model service rejected the request format.",
          technicalMessage: "developer role is unsupported",
          retryable: false,
        },
      }),
    ).toEqual({
      code: "MODEL_PROTOCOL_ERROR",
      summary: "The model service rejected the request format.",
      technicalMessage: "developer role is unsupported",
      retryable: false,
    });
  });

  it("falls back to legacy assistant error messages", () => {
    expect(
      assistantErrorDetails({
        role: "assistant",
        provider: "custom",
        model: "model",
        content: [],
        stopReason: "error",
        errorMessage: "upstream failed",
      }),
    ).toEqual({
      code: "MODEL_REQUEST_FAILED",
      summary: "The model request failed.",
      technicalMessage: "upstream failed",
      retryable: false,
    });
  });

  it("returns null for successful assistant messages", () => {
    expect(
      assistantErrorDetails({
        role: "assistant",
        provider: "custom",
        model: "model",
        content: [{ type: "text", text: "hello" }],
        stopReason: "stop",
      }),
    ).toBeNull();
  });
});
