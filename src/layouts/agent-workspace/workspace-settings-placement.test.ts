import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const topBarSource = readFileSync(
  fileURLToPath(new URL("./workspace-top-bar.tsx", import.meta.url)),
  "utf8",
);
const workspaceSource = readFileSync(
  fileURLToPath(new URL("./agent-workspace.tsx", import.meta.url)),
  "utf8",
);
const filePanelSource = readFileSync(
  fileURLToPath(
    new URL("../../features/file-panel/file-panel.tsx", import.meta.url),
  ),
  "utf8",
);

describe("workspace settings placement", () => {
  it("places Models and Skills in the top bar as icon controls", () => {
    expect(topBarSource).toContain("Cpu");
    expect(topBarSource).toContain("Sparkles");
    expect(topBarSource).toContain("onOpenModels");
    expect(topBarSource).toContain("onOpenSkills");
    expect(topBarSource).toContain("hasActiveWorkspace");
    expect(topBarSource).toContain("t.workspace.selectProjectForSkills");
  });

  it("keeps dialog state in AgentWorkspace and removes the sidebar footer", () => {
    expect(workspaceSource).toContain("onOpenModels={() => setModelsOpen(true)}");
    expect(workspaceSource).toContain("onOpenSkills={() => setSkillsOpen(true)}");
    expect(workspaceSource).toContain("hasActiveWorkspace={Boolean(activeCwd)}");
    expect(workspaceSource).not.toContain(
      '<div className="flex gap-1.5 p-2">',
    );
  });

  it("integrates the file-panel toggle into the adjacent headers", () => {
    expect(topBarSource).not.toContain("pr-12");
    expect(topBarSource).toContain("filePanelOpen");
    expect(topBarSource).toContain("onToggleFilePanel");
    expect(topBarSource).toContain("PanelRightOpen");

    expect(workspaceSource).not.toContain("fixed top-0 right-0");
    expect(workspaceSource).toContain(
      "onToggleFilePanel={() => setFilePanelOpen((open) => !open)}",
    );
    expect(workspaceSource).toContain(
      "onClose={() => setFilePanelOpen(false)}",
    );

    expect(filePanelSource).toContain("PanelRightClose");
    expect(filePanelSource).toContain("bg-panel");
  });

  it("uses panel surfaces for side regions and a quiet canvas for chat", () => {
    expect(workspaceSource).toContain("bg-panel");
    expect(workspaceSource).toContain("bg-canvas");
    expect(topBarSource).toContain("bg-panel");
    expect(topBarSource).toContain("border-line-subtle");
    expect(filePanelSource).toContain("bg-panel");
  });

  it("stretches top-bar icon buttons to the full toolbar height", () => {
    expect(topBarSource).toContain('className={`h-full rounded-none');
  });
});
