import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("./skills-page.tsx", import.meta.url)),
  "utf8",
);

describe("Skills page", () => {
  it("reuses project skill behavior without a top-level Dialog", () => {
    expect(source).toContain("useSkills(cwd)");
    expect(source).toContain("SkillList");
    expect(source).toContain("SkillDetail");
    expect(source).toContain("AddSkillPanel");
    expect(source).not.toContain("<Dialog open");
  });

  it("keeps refresh, installation, diagnostics, and busy guards", () => {
    expect(source).toContain("skills.refresh()");
    expect(source).toContain("skills.toggleModelInvocation()");
    expect(source).toContain("skills.savingSkillId");
    expect(source).toContain("skills.diagnostics");
  });

  it("delegates removal to the detail component with inline confirmation", () => {
    expect(source).toContain("skills.removeSkill()");
    expect(source).toContain("skills.removingSkillId");
    expect(source).not.toContain("ConfirmRemoveDialog");
  });

  it("provides Skills and Skill Packs views", () => {
    expect(source).toContain('"skills"');
    expect(source).toContain('"packs"');
    expect(source).toContain("useSkillPacks(cwd)");
    expect(source).toContain("SkillPackList");
    expect(source).toContain("SkillPackDetail");
    expect(source).toContain("AddSkillPackDialog");
    expect(source).toContain("bg-selected text-foreground");
  });

  it("keeps Skill Pack mutations consistent and exposes complete tab semantics", () => {
    expect(source).toContain("packs.loading || packBusy");
    expect(source).toContain("void skills.refresh()");
    expect(source).toContain('aria-controls="skills-view-panel"');
    expect(source).toContain("tabIndex={view === tab ? 0 : -1}");
    expect(source).toContain('event.key !== "ArrowLeft"');
    expect(source).toContain('role="tabpanel"');
  });

  it("navigates from a managed Skill to its owning Pack", () => {
    expect(source).toContain("onViewPack");
    expect(source).toContain("setSelectedPackId");
    expect(source).toContain('selectView("packs")');
  });

  it("shares the Codex-style settings rail hierarchy", () => {
    expect(source).toContain('w-[224px]');
    expect(source).toContain('border-line-subtle');
    expect(source).toContain('className="flex min-h-0 min-w-0 flex-1 flex-col bg-canvas"');
  });
});
