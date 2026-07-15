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
});
