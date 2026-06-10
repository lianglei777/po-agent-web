import { describe, expect, it } from "vitest";
import { countModelsByProvider, normalizeModelsConfig } from "./api";

describe("models config client contract", () => {
  it("normalizes invalid config values", () => {
    expect(normalizeModelsConfig(null)).toEqual({ providers: {} });
    expect(normalizeModelsConfig({ providers: [] })).toEqual({
      providers: {},
    });
  });

  it("preserves valid config data", () => {
    const config = {
      providers: { local: { api: "openai-completions" } },
      extra: true,
    };
    expect(normalizeModelsConfig(config)).toEqual(config);
  });

  it("counts available models by provider", () => {
    expect(
      countModelsByProvider([
        { id: "a", name: "A", provider: "openai" },
        { id: "b", name: "B", provider: "openai" },
        { id: "c", name: "C", provider: "anthropic" },
      ]),
    ).toEqual({ openai: 2, anthropic: 1 });
  });
});
