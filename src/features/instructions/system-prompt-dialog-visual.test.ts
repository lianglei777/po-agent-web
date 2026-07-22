import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("./system-prompt-dialog.tsx", import.meta.url)),
  "utf8",
);

describe("system prompt dialog visual contract", () => {
  it("uses a source navigator and one focused content pane", () => {
    expect(source).toContain("grid-cols-[14rem_minmax(0,1fr)]");
    expect(source).toContain("<aside");
    expect(source).toContain(
      'type ActiveView = "effective" | "global" | "project"',
    );
    expect(source).toContain('activeView === "effective"');
    expect(source).toContain("<EffectivePromptView");
    expect(source).toContain("<GlobalPromptEditor");
    expect(source).toContain("<ProjectInstructionsView");
  });

  it("keeps session freshness visible above the workbench", () => {
    expect(source.indexOf("sessionOutdated")).toBeLessThan(
      source.indexOf("grid-cols-[14rem_minmax(0,1fr)]"),
    );
    expect(source).toContain("reloadUnavailableWhileRunning");
  });

  it("previews project instructions before explicitly opening the file workspace", () => {
    expect(source).toContain('onClick={() => setActiveView("project")}');
    expect(source).toContain('activeView === "project"');
    expect(source).toContain("handleOpenProjectInstructions");
    expect(source).toContain("onOpenProjectInstructions?.()");
    expect(source).toContain("editInFileWorkspace");
    expect(source).not.toContain("saveProjectInstructions");
    expect(source).not.toContain("deleteProjectInstructions");
  });


  it("protects unsaved global edits before opening project instructions", () => {
    expect(source).toContain('type DiscardAction = "close" | "project"');
    expect(source).toContain('setDiscardAction("project")');
    expect(source).toContain('discardAction === "project"');
  });

  it("requires confirmation before deleting the global file", () => {
    expect(source).toContain("showDeleteConfirm");
    expect(source).toContain("deleteGlobalTitle");
  });

  it("keeps the frame fixed and gives the active content the scroll area", () => {
    expect(source).toContain("h-[min(46rem,85vh)]");
    expect(source).toContain("flex-col gap-0 overflow-hidden");
    expect(source).toContain('DialogHeader className="shrink-0');
    expect(source).toContain('DialogFooter className="shrink-0');
    expect(source).toContain('ScrollArea className="min-h-0 flex-1"');
  });
});
