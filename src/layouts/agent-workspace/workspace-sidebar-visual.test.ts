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

  it("keeps theme and locale as bottom icon controls", () => {
    expect(source).toContain("mt-auto");
    expect(source).toContain("onToggleTheme");
    expect(source).toContain("setLocale(nextLocale)");
    expect(source).toContain("<TooltipContent");
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
});
