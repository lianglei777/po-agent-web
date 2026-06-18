import { describe, expect, it } from "vitest";
import { mapAgentFailure } from "./agent-failure-mapper";

describe("mapAgentFailure", () => {
  it("classifies unsupported developer roles as protocol errors", () => {
    expect(
      mapAgentFailure({
        errorMessage:
          "400 messages[0].role: unknown variant `developer`, expected `system`",
        provider: "custom",
        model: "deepseek-v4-pro",
      }),
    ).toEqual({
      code: "MODEL_PROTOCOL_ERROR",
      message: "The model service rejected the request format.",
      technicalMessage:
        "400 messages[0].role: unknown variant `developer`, expected `system`",
      provider: "custom",
      model: "deepseek-v4-pro",
      retryable: false,
    });
  });

  it("classifies authentication, rate limit, and timeout failures", () => {
    expect(
      mapAgentFailure({ errorMessage: "401 invalid api key" }).code,
    ).toBe("MODEL_AUTH_FAILED");
    expect(
      mapAgentFailure({ errorMessage: "429 rate limit exceeded" }),
    ).toMatchObject({ code: "MODEL_RATE_LIMITED", retryable: true });
    expect(
      mapAgentFailure({ errorMessage: "request timed out" }),
    ).toMatchObject({ code: "MODEL_TIMEOUT", retryable: true });
  });

  it("redacts credentials from technical details", () => {
    const failure = mapAgentFailure({
      errorMessage:
        "Authorization: Bearer secret-token apiKey=super-secret",
    });

    expect(failure.technicalMessage).not.toContain("secret-token");
    expect(failure.technicalMessage).not.toContain("super-secret");
    expect(failure.technicalMessage).toContain("[REDACTED]");
  });
});
