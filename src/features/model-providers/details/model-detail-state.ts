import type {
  ConfiguredThinkingLevel,
  ModelEntry,
} from "../types";

const CONFIGURED_THINKING_LEVELS: ConfiguredThinkingLevel[] = [
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
];

export function isReasoningCapabilityEnabled(model: ModelEntry) {
  return model.reasoning !== false;
}

export function getSupportedConfiguredThinkingLevels(
  model: ModelEntry,
): ConfiguredThinkingLevel[] {
  if (!isReasoningCapabilityEnabled(model)) return [];
  return CONFIGURED_THINKING_LEVELS.filter(
    (level) => model.thinkingLevelMap?.[level] !== null,
  );
}

export function getDefaultThinkingOnLevel(
  model: ModelEntry,
): ConfiguredThinkingLevel | null {
  const levels = getSupportedConfiguredThinkingLevels(model);
  if (levels.length === 0) return null;
  if (
    model.thinkingDefaultLevel &&
    levels.includes(model.thinkingDefaultLevel)
  ) {
    return model.thinkingDefaultLevel;
  }
  if (levels.includes("high")) return "high";
  return levels.find((level) => level !== "xhigh") ?? levels[0] ?? null;
}
