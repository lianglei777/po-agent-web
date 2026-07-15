import { describe, expect, it } from "vitest";
import type { SkillPackInfo } from "./types";
import { reconcileSelectedSkillPack } from "./skill-state";

const PACKS: SkillPackInfo[] = [
  {
    packId: "pack_a",
    name: "A",
    description: "",
    source: "a",
    scope: null,
    status: "available",
    resources: { skills: [], extensions: [], prompts: [], themes: [] },
    containsExtensions: false,
  },
  {
    packId: "pack_b",
    name: "B",
    description: "",
    source: "b",
    scope: "project",
    status: "installed",
    resources: { skills: ["b"], extensions: [], prompts: [], themes: [] },
    containsExtensions: false,
  },
];

describe("Skill Pack selection", () => {
  it("preserves an existing selection after refresh", () => {
    expect(reconcileSelectedSkillPack(PACKS, "pack_b")).toBe("pack_b");
  });

  it("falls back to the first Pack", () => {
    expect(reconcileSelectedSkillPack(PACKS, "missing")).toBe("pack_a");
    expect(reconcileSelectedSkillPack([], "pack_a")).toBeNull();
  });
});
