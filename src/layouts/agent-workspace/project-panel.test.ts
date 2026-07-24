import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("./project-panel.tsx", import.meta.url)),
  "utf8",
);

describe("project panel", () => {
  it("switches between Files and Skills with complete tab semantics", () => {
    expect(source).toContain('(["files", "skills"] as const)');
    expect(source).toContain('role="tablist"');
    expect(source).toContain('role="tab"');
    expect(source).toContain('role="tabpanel"');
    expect(source).toContain("aria-controls");
    expect(source).toContain("aria-selected");
    expect(source).toContain('event.key !== "ArrowLeft"');
  });

  it("passes the selected project context to both feature surfaces", () => {
    expect(source).toContain("<FilePanel");
    expect(source).toContain("<SkillsPage");
    expect(source).toContain("cwd={cwd}");
    expect(source).toContain("projectName={projectName}");
  });

  it("owns the close action for the whole project panel", () => {
    expect(source).toContain("t.workspace.hideProjectPanel");
    expect(source).toContain("onClick={onClose}");
  });
});
