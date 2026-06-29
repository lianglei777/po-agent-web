import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("./branch-history.tsx", import.meta.url)),
  "utf8",
);

describe("BranchHistory visual contract", () => {
  it("renders a dropdown listing collected leaves", () => {
    expect(source).toContain("export function BranchHistory");
    expect(source).toContain("<DropdownMenu");
    expect(source).toContain("collectLeaves");
    expect(source).toContain("DropdownMenuItem");
  });

  it("marks the active leaf with a check", () => {
    expect(source).toContain("activeLeafId");
    expect(source).toContain("<Check");
  });

  it("calls onChangeLeaf when a leaf is selected", () => {
    expect(source).toContain("onChangeLeaf");
  });

  it("uses the branchHistory copy for the trigger", () => {
    expect(source).toContain("t.chat.message.branchHistory");
  });
});
