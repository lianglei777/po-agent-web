import { describe, expect, it } from "vitest";
import {
  getCompatFields,
  getEffectiveApi,
  sanitizeCompat,
  sanitizeModelsConfig,
} from "./model-compat";

describe("model compatibility contract", () => {
  it("exposes supportsDeveloperRole only for openai-completions", () => {
    expect(
      getCompatFields("openai-completions").some(
        (field) => field.key === "supportsDeveloperRole",
      ),
    ).toBe(true);
    expect(
      getCompatFields("openai-responses").some(
        (field) => field.key === "supportsDeveloperRole",
      ),
    ).toBe(false);
    expect(
      getCompatFields("anthropic-messages").some(
        (field) => field.key === "supportsDeveloperRole",
      ),
    ).toBe(false);
  });

  it("uses a model api override before the provider api", () => {
    expect(getEffectiveApi("openai-completions", "anthropic-messages")).toBe(
      "anthropic-messages",
    );
    expect(getEffectiveApi("openai-responses", undefined)).toBe(
      "openai-responses",
    );
  });

  it("removes fields that do not belong to the selected protocol", () => {
    expect(
      sanitizeCompat("openai-responses", {
        sendSessionIdHeader: false,
        supportsDeveloperRole: false,
        supportsLongCacheRetention: true,
      }),
    ).toEqual({
      sendSessionIdHeader: false,
      supportsLongCacheRetention: true,
    });
    expect(
      sanitizeCompat("google-generative-ai", {
        supportsDeveloperRole: false,
      }),
    ).toBeUndefined();
  });

  it("removes invalid enum and object values", () => {
    expect(
      sanitizeCompat("openai-completions", {
        maxTokensField: "invalid",
        thinkingFormat: "deepseek",
        openRouterRouting: [],
        supportsStore: "yes",
      }),
    ).toEqual({ thinkingFormat: "deepseek" });
  });

  it("sanitizes provider and model compat using their effective api", () => {
    expect(
      sanitizeModelsConfig({
        providers: {
          custom: {
            api: "openai-completions",
            compat: {
              supportsDeveloperRole: false,
              sendSessionIdHeader: true,
            },
            models: [
              {
                id: "claude-proxy",
                api: "anthropic-messages",
                compat: {
                  supportsDeveloperRole: false,
                  supportsCacheControlOnTools: false,
                },
              },
            ],
          },
        },
      }),
    ).toEqual({
      providers: {
        custom: {
          api: "openai-completions",
          compat: { supportsDeveloperRole: false },
          models: [
            {
              id: "claude-proxy",
              api: "anthropic-messages",
              compat: { supportsCacheControlOnTools: false },
            },
          ],
        },
      },
    });
  });

  it("rejects unknown api values in strict mode", () => {
    expect(() =>
      sanitizeModelsConfig(
        {
          providers: {
            custom: { api: "future-api" },
          },
        },
        { strictApi: true },
      ),
    ).toThrow("Unsupported API protocol: future-api");
  });
});
