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
const sidebarSource = readFileSync(
  fileURLToPath(new URL("./workspace-sidebar.tsx", import.meta.url)),
  "utf8",
);
const projectPanelSource = readFileSync(
  fileURLToPath(new URL("./project-panel.tsx", import.meta.url)),
  "utf8",
);

describe("workspace composition", () => {
  it("keeps global Model Provider in the sidebar and project Skills in the right panel", () => {
    expect(sidebarSource).toContain("t.workspace.modelProvider");
    expect(sidebarSource).not.toContain("t.workspace.skills");
    expect(projectPanelSource).toContain("t.workspace.skills");
    expect(projectPanelSource).toContain("<SkillsPage");
    expect(topBarSource).not.toContain("Cpu");
    expect(topBarSource).not.toContain("Moon");
  });

  it("keeps Chat mounted while central pages switch", () => {
    expect(workspaceSource).toContain(
      'activeView === "chat" ? "flex min-h-0 flex-1" : "hidden"',
    );
    expect(workspaceSource).toContain('activeView === "model-provider"');
    expect(workspaceSource).toContain("<ModelProviderPage");
    expect(workspaceSource).toContain("<ProjectPanel");
    expect(workspaceSource).not.toContain("<ModelsConfigDialog");
    expect(workspaceSource).not.toContain("<SkillsConfigDialog");
  });

  it("restores the manual Project panel only for Chat", () => {
    expect(workspaceSource).toContain('activeView === "chat"');
    expect(workspaceSource).toContain("projectPanelOpen");
    expect(workspaceSource).toContain("cwd={activeCwd}");
    expect(workspaceSource).toContain("activeTab={projectPanelTab}");
    expect(workspaceSource).toContain("onOpenFile={handleOpenFile}");
    expect(workspaceSource).toContain("refreshKey={explorerRefreshKey}");
  });

  it("places Model Provider save feedback in the workspace top bar", () => {
    expect(topBarSource).toContain("modelProviderSaveStatus");
    expect(topBarSource).toContain('role="status"');
    expect(topBarSource).toContain('role="alert"');
    expect(workspaceSource).toContain(
      "modelProviderSaveStatus={modelProviderSaveStatus}",
    );
    expect(workspaceSource).toContain(
      "onSaveStatusChange={setModelProviderSaveStatus}",
    );
  });

  it("uses a desktop-only workspace floor", () => {
    expect(workspaceSource).toContain("min-w-[1024px]");
    expect(workspaceSource).not.toContain("max-[640px]");
  });
});
