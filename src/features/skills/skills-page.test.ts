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

  it("delegates removal confirmation to a dedicated dialog component", () => {
    expect(source).toContain("ConfirmRemoveDialog");
    expect(source).toContain("skills.removeSkill()");
    expect(source).toContain("skills.removingSkillId");
  });
});
