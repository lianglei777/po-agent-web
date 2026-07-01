import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const picker = readFileSync(
  `${root}/src/features/sessions/project-picker.tsx`,
  "utf8",
);
const english = readFileSync(
  `${root}/src/i18n/dictionaries/en.ts`,
  "utf8",
);
const chinese = readFileSync(
  `${root}/src/i18n/dictionaries/zh.ts`,
  "utf8",
);

describe("project picker interaction contract", () => {
  it("defaults to absolute-path entry and loads browsing only on demand", () => {
    expect(picker).toContain('useState<"input" | "browse">("input")');
    expect(picker).toContain("<Input");
    expect(picker).toContain("autoFocus");
    expect(picker).toContain('type="submit"');
    expect(picker).toContain('setMode("browse")');
    expect(picker).toContain("if (!result) void navigate()");
  });

  it("provides matching English and Chinese copy", () => {
    for (const dictionary of [english, chinese]) {
      expect(dictionary).toContain("projectPath:");
      expect(dictionary).toContain("projectPathHint:");
      expect(dictionary).toContain("browseDirectories:");
      expect(dictionary).toContain("backToPathEntry:");
      expect(dictionary).toContain("addProject:");
    }
  });
});
