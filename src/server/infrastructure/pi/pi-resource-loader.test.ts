import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createPiResourceLoader } from "./pi-resource-loader";

describe("createPiResourceLoader", () => {
  it("loads built-in skills with dedicated source metadata", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "po-builtins-"));
    const cwd = path.join(root, "workspace");
    const agentDir = path.join(root, "agent");
    const builtinSkillsDir = path.join(root, "builtins");
    await fs.mkdir(path.join(builtinSkillsDir, "review-changes"), {
      recursive: true,
    });
    await fs.mkdir(cwd, { recursive: true });
    await fs.writeFile(
      path.join(builtinSkillsDir, "review-changes", "SKILL.md"),
      "---\nname: review-changes\ndescription: Review changes\n---\n",
    );

    try {
      const loader = await createPiResourceLoader({
        cwd,
        agentDir,
        builtinSkillsDir,
      });

      expect(loader.getSkills().skills).toEqual([
        expect.objectContaining({
          name: "review-changes",
          sourceInfo: expect.objectContaining({ source: "po-agent-builtin" }),
        }),
      ]);
    } finally {
      await fs.rm(root, { force: true, recursive: true });
    }
  });

  it("preserves Package metadata when built-in skills are extended", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "po-packages-"));
    const cwd = path.join(root, "workspace");
    const agentDir = path.join(root, "agent");
    const builtinSkillsDir = path.join(root, "builtins");
    const packageDir = path.join(root, "developer-workflows");
    const settingsDir = path.join(cwd, ".pi");
    const skillDir = path.join(packageDir, "skills", "prepare-change");
    await fs.mkdir(path.join(builtinSkillsDir, "review-changes"), {
      recursive: true,
    });
    await fs.mkdir(skillDir, { recursive: true });
    await fs.mkdir(settingsDir, { recursive: true });
    await fs.writeFile(
      path.join(builtinSkillsDir, "review-changes", "SKILL.md"),
      "---\nname: review-changes\ndescription: Review changes\n---\n",
    );
    await fs.writeFile(
      path.join(skillDir, "SKILL.md"),
      "---\nname: prepare-change\ndescription: Prepare change\n---\n",
    );
    await fs.writeFile(
      path.join(packageDir, "package.json"),
      JSON.stringify({ name: "developer-workflows", pi: { skills: ["./skills"] } }),
    );
    const configuredSource = path.relative(settingsDir, packageDir);
    await fs.writeFile(
      path.join(settingsDir, "settings.json"),
      JSON.stringify({ packages: [configuredSource] }),
    );

    try {
      const loader = await createPiResourceLoader({
        cwd,
        agentDir,
        builtinSkillsDir,
      });
      const packageSkill = loader
        .getSkills()
        .skills.find((skill) => skill.name === "prepare-change");

      expect(packageSkill?.sourceInfo).toMatchObject({
        source: configuredSource,
        scope: "project",
        origin: "package",
      });
    } finally {
      await fs.rm(root, { force: true, recursive: true });
    }
  });
});
