import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const packRoot = path.resolve(
  "resources",
  "official-packs",
  "git-release-workflows",
);

describe("Git & Release Workflows official Pack", () => {
  it("declares a versioned Pi package with both skills", async () => {
    const manifest = JSON.parse(
      await readFile(path.join(packRoot, "package.json"), "utf8"),
    );

    expect(manifest).toMatchObject({
      name: "@po-agent/git-release-workflows",
      version: "1.0.0",
      pi: { skills: ["./skills"] },
    });
  });

  it.each([
    ["prepare-release", ["Verdict", "Evidence", "Blockers", "Next actions"]],
    ["write-release-notes", ["explicit Git range", "verified user impact"]],
  ])("ships a focused %s skill", async (name, requiredPhrases) => {
    const content = await readFile(
      path.join(packRoot, "skills", name, "SKILL.md"),
      "utf8",
    );
    const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/u)?.[1] ?? "";
    const description = frontmatter.match(/^description:\s*(.+)$/mu)?.[1] ?? "";

    expect(frontmatter).toContain(`name: ${name}`);
    expect(description).toMatch(/^Use when\b/u);
    expect(content.trim().split(/\s+/u).length).toBeLessThan(500);
    for (const phrase of requiredPhrases) expect(content).toContain(phrase);
  });

  it("prevents release mutations and invented release metadata", async () => {
    const prepare = await readFile(
      path.join(packRoot, "skills", "prepare-release", "SKILL.md"),
      "utf8",
    );
    const notes = await readFile(
      path.join(packRoot, "skills", "write-release-notes", "SKILL.md"),
      "utf8",
    );

    expect(prepare).toMatch(/clean worktree|clean state/iu);
    expect(prepare).toMatch(/validation|check/iu);
    expect(prepare).toMatch(/version/iu);
    expect(prepare).toMatch(/risk/iu);
    expect(prepare).toMatch(/never (?:commit|tag|publish|push)/iu);
    expect(notes).toMatch(/label.*infer/iu);
    expect(notes).toMatch(/never invent/iu);
    expect(notes).toMatch(/issue|link/iu);
    expect(notes).toMatch(/compatibility|migration/iu);
  });
});
