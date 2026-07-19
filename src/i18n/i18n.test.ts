import { describe, expect, it } from "vitest";
import { en } from "./dictionaries/en";
import { zh } from "./dictionaries/zh";
import { DEFAULT_LOCALE, resolveLocale } from "./locales";

describe("resolveLocale", () => {
  it("prefers a stored supported locale", () => {
    expect(
      resolveLocale({
        storedLocale: "en",
        browserLanguages: ["zh-CN"],
      }),
    ).toBe("en");
  });

  it("matches browser language prefixes", () => {
    expect(resolveLocale({ browserLanguages: ["zh-CN", "en-US"] })).toBe("zh");
    expect(resolveLocale({ browserLanguages: ["en-US", "zh-CN"] })).toBe("en");
  });

  it("falls back to the default locale", () => {
    expect(
      resolveLocale({
        storedLocale: "fr",
        browserLanguages: ["fr-FR"],
      }),
    ).toBe(DEFAULT_LOCALE);
  });
});

describe("dictionaries", () => {
  it("keep zh and en keys in sync", () => {
    expect(flattenKeys(zh)).toEqual(flattenKeys(en));
  });

  it("only promises the available add-skill path", () => {
    expect(en.skills.noSkillsFoundDescription).toBe(
      "Add a skill from the market.",
    );
    expect(zh.skills.noSkillsFoundDescription).toBe(
      "从技能市场添加一个技能。",
    );
  });

  it("uses the approved workspace navigation labels", () => {
    expect(en.workspace.modelProvider).toBe("Model Provider");
    expect(zh.workspace.modelProvider).toBe("模型");
    expect(en.workspace.skills).toBe("Skills");
    expect(zh.workspace.skills).toBe("技能");
  });

  it("provides Skill Pack lifecycle copy in both locales", () => {
    expect(en.skills.packs.addAction).toBe("Add Skill Pack");
    expect(zh.skills.packs.addAction).toBe("添加技能包");
    expect(en.skills.packs.updateAction).toBe("Check & Update");
    expect(zh.skills.packs.repairAction).toBe("修复");
  });
});

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object") return [prefix];
  return Object.entries(value)
    .flatMap(([key, child]) =>
      flattenKeys(child, prefix ? `${prefix}.${key}` : key),
    )
    .sort();
}
