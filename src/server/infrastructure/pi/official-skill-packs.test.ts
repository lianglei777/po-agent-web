import { describe, expect, it } from "vitest";
import path from "node:path";
import { getOfficialSkillPacks } from "./official-skill-packs";

describe("official Skill Pack catalog", () => {
  it("ships the Git and release workflows package", () => {
    const appRoot = path.resolve("C:\\app");
    expect(getOfficialSkillPacks({}, appRoot)).toEqual([
      {
        id: "git-release-workflows",
        version: "1.0.0",
        source: path.join(
          appRoot,
          "resources",
          "official-packs",
          "git-release-workflows",
        ),
        name: "Git & Release Workflows",
        description: "Review release readiness and write evidence-based release notes.",
        expectedSkills: ["prepare-release", "write-release-notes"],
        containsExtensions: false,
      },
    ]);
  });

  it("uses the packaged official Pack directory when provided", () => {
    expect(
      getOfficialSkillPacks({ PO_AGENT_OFFICIAL_PACKS_DIR: "D:\\official" })[0]
        ?.source,
    ).toBe(path.join("D:\\official", "git-release-workflows"));
  });
});
