import { describe, expect, it } from "vitest";
import { evaluateModelTestMessages } from "./model-test-result";

describe("evaluateModelTestMessages", () => {
  it("accepts a successful assistant text response", () => {
    expect(
      evaluateModelTestMessages([
        {
          role: "assistant",
          content: [{ type: "text", text: "OK" }],
          provider: "provider",
          model: "model",
          stopReason: "stop",
        },
      ]),
    ).toEqual({ ok: true, responseText: "OK" });
  });

  it("rejects an assistant error even when prompt resolves", () => {
    expect(
      evaluateModelTestMessages([
        {
          role: "assistant",
          content: [],
          provider: "provider",
          model: "model",
          stopReason: "error",
          errorMessage: "400 unsupported developer role",
        },
      ]),
    ).toEqual({
      ok: false,
      error: "400 unsupported developer role",
    });
  });

  it.each(["aborted", "rejected"])(
    "rejects an assistant %s stop reason",
    (stopReason) => {
      expect(
        evaluateModelTestMessages([
          {
            role: "assistant",
            content: [{ type: "text", text: "partial" }],
            stopReason,
          },
        ]),
      ).toEqual({
        ok: false,
        error: `Model request ended with ${stopReason}`,
      });
    },
  );

  it("rejects missing or empty assistant output", () => {
    expect(evaluateModelTestMessages([])).toEqual({
      ok: false,
      error: "Model returned no assistant response",
    });
    expect(
      evaluateModelTestMessages([
        {
          role: "assistant",
          content: [],
          provider: "provider",
          model: "model",
          stopReason: "stop",
        },
      ]),
    ).toEqual({
      ok: false,
      error: "Model returned no text output",
    });
  });
});
