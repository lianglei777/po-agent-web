import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const read = (name: string) =>
  readFileSync(`${root}/src/components/ui/${name}.tsx`, "utf8");

describe("shared UI visual contract", () => {
  test("uses the Codex compact rounded control scale", () => {
    expect(read("button")).toContain("rounded-lg");
    expect(read("input")).toContain("rounded-lg");
    expect(read("textarea")).toContain("rounded-lg");
    expect(read("select")).toContain("rounded-lg");
    expect(read("dialog")).toContain("rounded-xl");
    expect(read("button")).not.toContain("active:translate-y-px");
  });

  test("reserves shadows for floating surfaces", () => {
    expect(read("card")).toContain("shadow-none");
    expect(read("card")).not.toContain("shadow-[var(--shadow-floating)]");
    expect(read("dialog")).toContain("shadow-[var(--shadow-floating)]");
    expect(read("tooltip")).toContain("shadow-[var(--shadow-floating)]");
    expect(read("select")).toContain("shadow-[var(--shadow-floating)]");
  });

  test("uses shared motion tokens for interactive controls", () => {
    expect(read("button")).toContain("duration-[var(--motion-fast)]");
    expect(read("accordion")).toContain("duration-[var(--motion-standard)]");
  });

  test("keeps resize handles quiet by default and explicit on focus", () => {
    const resizeHandle = read("resize-handle");
    expect(resizeHandle).toContain("before:h-[9px]");
    expect(resizeHandle).toContain("before:w-[9px]");
    expect(resizeHandle).toContain("focus-visible:ring-2");
    expect(resizeHandle).toContain("focus-visible:ring-ring");
    expect(resizeHandle).toContain(
      "data-[dragging=true]:bg-line-emphasis",
    );
  });

  test("uses semantic accent and readable state tokens", () => {
    const button = read("button");
    const input = read("input");
    const textarea = read("textarea");
    const select = read("select");
    const badge = read("badge");

    expect(button).toContain("focus-visible:ring-ring");
    expect(button).not.toContain("focus-visible:ring-ring/");
    expect(button).toContain("active:bg-primary/75");
    expect(button).toContain("active:bg-selected");
    expect(button).toContain("disabled:border-transparent");
    expect(button).toContain("bg-primary text-primary-foreground hover:bg-primary/85 active:bg-primary/75");
    expect(button).toContain("bg-secondary text-secondary-foreground hover:bg-hover active:bg-selected");
    expect(button).toContain("text-muted-foreground hover:bg-hover hover:text-foreground active:bg-selected");
    expect(input).toContain("hover:border-line-strong");
    expect(input).toContain("bg-elevated");
    expect(input).toContain("placeholder:text-dim");
    expect(textarea).toContain("hover:border-line-strong");
    expect(textarea).toContain("bg-elevated");
    expect(textarea).toContain("placeholder:text-dim");
    expect(select).toContain("focus-visible:ring-ring");
    expect(select).not.toContain("focus-visible:ring-ring/");
    expect(badge).not.toContain("bg-accent text-accent-foreground");
  });
});
