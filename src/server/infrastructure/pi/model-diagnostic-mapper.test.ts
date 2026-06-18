import { describe, expect, it } from "vitest";
import { mapModelDiagnostic } from "./model-diagnostic-mapper";

describe("mapModelDiagnostic", () => {
  it("suggests disabling developer roles only for openai-completions", () => {
    expect(
      mapModelDiagnostic({
        api: "openai-completions",
        errorMessage:
          "400 messages[0].role unknown variant `developer`, expected `system`",
        provider: "custom",
        model: "deepseek-v4-pro",
      }),
    ).toMatchObject({
      code: "MODEL_PROTOCOL_ERROR",
      provider: "custom",
      model: "deepseek-v4-pro",
      suggestedPatch: {
        scope: "model",
        api: "openai-completions",
        changes: { "compat.supportsDeveloperRole": false },
      },
    });
    expect(
      mapModelDiagnostic({
        api: "anthropic-messages",
        errorMessage: "unsupported developer role",
      }).suggestedPatch,
    ).toBeUndefined();
  });

  it("does not overwrite an explicit conflicting compatibility value", () => {
    expect(
      mapModelDiagnostic({
        api: "openai-completions",
        compat: { supportsDeveloperRole: true },
        errorMessage: "unsupported developer role",
      }).suggestedPatch,
    ).toBeUndefined();
  });

  it.each([
    [
      "reasoning_effort is not supported",
      "compat.supportsReasoningEffort",
      false,
    ],
    [
      "unknown field max_completion_tokens",
      "compat.maxTokensField",
      "max_tokens",
    ],
    [
      "stream_options.include_usage is unsupported",
      "compat.supportsUsageInStreaming",
      false,
    ],
    [
      "tools[0].function.strict is not allowed",
      "compat.supportsStrictMode",
      false,
    ],
  ])("maps %s to a protocol-safe patch", (message, path, value) => {
    expect(
      mapModelDiagnostic({
        api: "openai-completions",
        errorMessage: message,
      }).suggestedPatch?.changes,
    ).toEqual({ [path]: value });
  });

  it("maps Anthropic tool compatibility failures", () => {
    expect(
      mapModelDiagnostic({
        api: "anthropic-messages",
        errorMessage: "cache_control is not supported on tools",
      }).suggestedPatch?.changes,
    ).toEqual({ "compat.supportsCacheControlOnTools": false });
    expect(
      mapModelDiagnostic({
        api: "anthropic-messages",
        errorMessage: "eager_input_streaming is not supported",
      }).suggestedPatch?.changes,
    ).toEqual({ "compat.supportsEagerToolInputStreaming": false });
  });

  it("redacts credentials and classifies common operational failures", () => {
    const diagnostic = mapModelDiagnostic({
      errorMessage:
        "401 Authorization: Bearer secret-token apiKey=super-secret",
    });
    expect(diagnostic).toMatchObject({
      code: "MODEL_AUTH_FAILED",
      retryable: false,
    });
    expect(diagnostic.technicalMessage).not.toContain("secret-token");
    expect(diagnostic.technicalMessage).not.toContain("super-secret");
  });
});
