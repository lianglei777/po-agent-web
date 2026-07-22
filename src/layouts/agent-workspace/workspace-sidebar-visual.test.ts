import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("./workspace-sidebar.tsx", import.meta.url)),
  "utf8",
);
const sessionsSource = readFileSync(
  fileURLToPath(
    new URL("../../features/sessions/session-sidebar.tsx", import.meta.url),
  ),
  "utf8",
);
const topBarSource = readFileSync(
  fileURLToPath(new URL("./workspace-top-bar.tsx", import.meta.url)),
  "utf8",
);
const workspaceSource = readFileSync(
  fileURLToPath(new URL("./agent-workspace.tsx", import.meta.url)),
  "utf8",
);

describe("workspace sidebar", () => {
  it("orders global actions before project sessions", () => {
    expect(source.indexOf("t.workspace.newChat")).toBeLessThan(
      source.indexOf("t.workspace.modelProvider"),
    );
    expect(source.indexOf("t.workspace.modelProvider")).toBeLessThan(
      source.indexOf("t.workspace.skills"),
    );
    expect(source.indexOf("t.workspace.skills")).toBeLessThan(
      source.indexOf("<SessionSidebar"),
    );
  });

  it("keeps system prompt and locale together in the bottom action row", () => {
    expect(source).toContain("mt-auto");
    expect(source).toContain("onOpenSystemPrompt");
    expect(source).toContain("t.workspace.systemPrompt");
    expect(source).toContain("setLocale(nextLocale)");
    expect(source).toContain("<TooltipContent");
    expect(topBarSource).not.toContain("onOpenSystemPrompt");
    expect(topBarSource).not.toContain("t.workspace.systemPrompt");
  });

  it("explains disabled new-chat and Skills actions", () => {
    expect(source).toContain("disabled={!selectedCwd}");
    expect(source).toContain("t.chat.input.selectProjectBeforeStart");
    expect(source).toContain("t.workspace.selectProjectForSkills");
    expect(source).toContain('className="inline-flex"');
  });

  it("keeps files out of project and session navigation", () => {
    expect(sessionsSource).not.toContain("FileExplorer");
    expect(sessionsSource).not.toContain("sessionPanelHeight");
    expect(sessionsSource).toContain("groupSessionsByProject");
  });

  it("uses quiet Codex-like workspace surfaces without glass effects", () => {
    expect(source).toContain("bg-[var(--sidebar-bg)] p-2.5");
    expect(source).not.toContain("backdrop-blur");
    expect(source).toContain(
      'variant={activeView === "model-provider" ? "secondary" : "ghost"}',
    );
    expect(source).not.toContain("bg-selected");
    expect(workspaceSource).toContain("bg-canvas");
    expect(topBarSource).toContain("border-line-subtle bg-canvas");
    expect(topBarSource).not.toContain("backdrop-blur");
  });
});
