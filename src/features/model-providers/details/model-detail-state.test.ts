import { describe, expect, it } from "vitest";
import {
  getDefaultThinkingOnLevel,
  getSupportedConfiguredThinkingLevels,
} from "./model-detail-state";

describe("model detail display state", () => {
  it("derives supported configured thinking levels from the map", () => {
    expect(
      getSupportedConfiguredThinkingLevels({
        id: "reasoner",
        reasoning: true,
        thinkingLevelMap: {
          minimal: null,
          low: "low",
          medium: "medium",
          high: "high",
          xhigh: "max",
        },
      }),
    ).toEqual(["low", "medium", "high", "xhigh"]);
  });

  it("enables reasoning by default unless it is explicitly disabled", () => {
    expect(getSupportedConfiguredThinkingLevels({ id: "default" })).toEqual([
      "minimal",
      "low",
      "medium",
      "high",
      "xhigh",
    ]);
    expect(
      getSupportedConfiguredThinkingLevels({
        id: "disabled",
        reasoning: false,
      }),
    ).toEqual([]);
  });

  it("defaults Thinking On to high when possible", () => {
    expect(
      getDefaultThinkingOnLevel({
        id: "reasoner",
        reasoning: true,
        thinkingLevelMap: { high: "high", xhigh: "max" },
      }),
    ).toBe("high");
  });
});
