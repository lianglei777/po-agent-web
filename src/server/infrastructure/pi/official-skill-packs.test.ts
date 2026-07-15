import { describe, expect, it } from "vitest";
import { getOfficialSkillPacks } from "./official-skill-packs";

describe("official Skill Pack catalog", () => {
  it("does not ship demonstration packages", () => {
    expect(getOfficialSkillPacks()).toEqual([]);
  });
});
