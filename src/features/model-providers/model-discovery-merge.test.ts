import { describe, expect, it } from "vitest";
import { mergeDiscoveredModels } from "./model-discovery-merge";
import type { ModelDiscoverySuggestion, ModelsJson } from "./types";

describe("mergeDiscoveredModels", () => {
  it("adds only new discovered models and selects the first inserted model", () => {
    const config: ModelsJson = {
      providers: {
        custom: {
          api: "openai-completions",
          models: [{ id: "existing" }],
        },
      },
    };
    const suggestions: ModelDiscoverySuggestion[] = [
      {
        verification: "unverified",
        model: { id: "existing", name: "Existing" },
      },
      {
        verification: "unverified",
        model: {
          id: "new-model",
          reasoning: true,
          contextWindow: 128000,
          maxTokens: 16384,
        },
      },
    ];

    expect(mergeDiscoveredModels(config, "custom", suggestions)).toEqual({
      config: {
        providers: {
          custom: {
            api: "openai-completions",
            models: [
              { id: "existing" },
              {
                id: "new-model",
                reasoning: true,
                thinkingDefaultLevel: "high",
                contextWindow: 128000,
                maxTokens: 16384,
              },
            ],
          },
        },
      },
      insertedCount: 1,
      selection: { type: "model", providerName: "custom", index: 1 },
    });
  });

  it("adds only the selected subset of discovered models", () => {
    const config: ModelsJson = {
      providers: { custom: { models: [{ id: "existing" }] } },
    };
    const suggestions: ModelDiscoverySuggestion[] = [
      {
        verification: "unverified",
        model: { id: "new-a" },
      },
      {
        verification: "unverified",
        model: { id: "new-b" },
      },
    ];

    const result = mergeDiscoveredModels(config, "custom", [suggestions[0]]);

    expect(result.insertedCount).toBe(1);
    expect(
      result.config.providers?.custom.models?.map((m) => m.id),
    ).toEqual(["existing", "new-a"]);
    expect(result.selection).toEqual({
      type: "model",
      providerName: "custom",
      index: 1,
    });
  });

  it("defaults thinkingDefaultLevel to high for reasoning models without one", () => {
    const result = mergeDiscoveredModels(
      { providers: { custom: {} } },
      "custom",
      [
        {
          verification: "unverified",
          model: { id: "reasoner-model", reasoning: true },
        },
      ],
    );

    expect(result.config.providers?.custom.models?.[0]).toMatchObject({
      id: "reasoner-model",
      reasoning: true,
      thinkingDefaultLevel: "high",
    });
  });

  it("keeps selection on the provider when every suggestion already exists", () => {
    const config: ModelsJson = {
      providers: { custom: { models: [{ id: "existing" }] } },
    };

    expect(
      mergeDiscoveredModels(config, "custom", [
        {
          verification: "unverified",
          model: { id: "existing" },
        },
      ]),
    ).toEqual({
      config,
      insertedCount: 0,
      selection: { type: "provider", name: "custom" },
    });
  });
});
