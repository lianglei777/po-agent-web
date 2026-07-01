import { describe, expect, it } from "vitest";
import {
  applyModelDiagnosticPatch,
  changeCompatValue,
  changeEntryApi,
} from "./compat-editor-state";

describe("compat editor state", () => {
  it("removes a boolean field when Auto is selected", () => {
    expect(
      changeCompatValue(
        { supportsDeveloperRole: false, supportsStore: true },
        "supportsDeveloperRole",
        undefined,
      ),
    ).toEqual({ supportsStore: true });
  });

  it("removes compat values that do not belong to a new protocol", () => {
    expect(
      changeEntryApi(
        {
          api: "openai-completions",
          compat: {
            supportsDeveloperRole: false,
            supportsLongCacheRetention: true,
          },
        },
        "openai-responses",
      ),
    ).toEqual({
      api: "openai-responses",
      compat: { supportsLongCacheRetention: true },
    });
  });

  it("applies a protocol-compatible diagnostic patch to a model", () => {
    expect(
      applyModelDiagnosticPatch(
        { id: "deepseek-v4-pro", compat: { thinkingFormat: "deepseek" } },
        "openai-completions",
        {
          scope: "model",
          api: "openai-completions",
          changes: { "compat.supportsDeveloperRole": false },
          reason: "Use system messages.",
        },
      ),
    ).toEqual({
      id: "deepseek-v4-pro",
      compat: {
        thinkingFormat: "deepseek",
        supportsDeveloperRole: false,
      },
    });
  });

  it("ignores a patch for another protocol", () => {
    expect(
      applyModelDiagnosticPatch(
        { id: "model" },
        "anthropic-messages",
        {
          scope: "model",
          api: "openai-completions",
          changes: { "compat.supportsDeveloperRole": false },
          reason: "Use system messages.",
        },
      ),
    ).toEqual({ id: "model" });
  });
});
