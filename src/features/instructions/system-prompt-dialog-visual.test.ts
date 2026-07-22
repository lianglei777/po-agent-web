import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("./system-prompt-dialog.tsx", import.meta.url)),
  "utf8",
);

describe("system prompt dialog visual contract", () => {
  it("shows the effective prompt before the global editor", () => {
    expect(source.indexOf("finalSystemPrompt")).toBeLessThan(
      source.indexOf("globalContentPlaceholder"),
    );
  });

  it("opens project instructions in the file workspace instead of editing inline", () => {
    expect(source).toContain("onOpenProjectInstructions");
    expect(source).not.toContain("saveProjectInstructions");
    expect(source).not.toContain("deleteProjectInstructions");
  });

  it("requires confirmation before deleting the global file", () => {
    expect(source).toContain("showDeleteConfirm");
    expect(source).toContain("deleteGlobalTitle");
  });

  it("keeps the header and footer visible while the long body scrolls", () => {
    expect(source).toContain("max-h-[85vh] min-h-0");
    expect(source).toContain("flex-col gap-0 overflow-hidden");
    expect(source).toContain('className="min-h-0 flex-1 overflow-y-auto px-6 py-5"');
    expect(source).toContain('DialogHeader className="shrink-0');
    expect(source).toContain('DialogFooter className="shrink-0');
  });
});
