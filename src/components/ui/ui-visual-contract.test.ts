import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const read = (name: string) =>
  readFileSync(`${root}/src/components/ui/${name}.tsx`, "utf8");

describe("shared UI visual contract", () => {
  test("uses the Codex compact rounded control scale", () => {
    expect(read("button")).toContain("rounded-control");
    expect(read("input")).toContain("rounded-control");
    expect(read("textarea")).toContain("rounded-control");
    expect(read("select")).toContain("rounded-control");
    expect(read("dialog")).toContain("rounded-floating");
    expect(read("native-select")).toContain("rounded-control");
    expect(read("segmented-control")).toContain("rounded-control");
    expect(read("radio-card")).toContain("rounded-control");
    expect(read("button")).not.toContain("active:translate-y-px");
  });

  test("uses one density contract across form controls", () => {
    for (const control of ["input", "textarea", "select", "native-select"]) {
      const source = read(control);
      expect(source).toContain('density?: "default" | "compact"');
      expect(source).toContain('density === "compact"');
    }
  });

  test("keeps dialog dismissal and binary choices keyboard visible", () => {
    const dialog = read("dialog");
    const segmented = read("segmented-control");
    const radioCard = read("radio-card");
    const switchControl = read("switch");

    expect(dialog).toContain("inline-flex size-8");
    expect(dialog).toContain("focus-visible:ring-2");
    expect(segmented).toContain("ArrowLeft");
    expect(segmented).toContain("ArrowRight");
    expect(segmented).toContain('role={kind === "tabs" ? "tablist" : "radiogroup"}');
    expect(radioCard).toContain("has-[:focus-visible]:ring-2");
    expect(switchControl).toContain('role="switch"');
  });

  test("reserves shadows for floating surfaces", () => {
    expect(read("card")).toContain("shadow-none");
    expect(read("card")).not.toContain("shadow-[var(--shadow-floating)]");
    expect(read("dialog")).toContain("shadow-[var(--shadow-floating)]");
    expect(read("tooltip")).toContain("shadow-[var(--shadow-floating)]");
    expect(read("select")).toContain("shadow-[var(--shadow-floating)]");
  });

  test("keeps dropdown menus content-sized and viewport-constrained", () => {
    const dropdownMenu = read("dropdown-menu");
    const content = dropdownMenu.slice(
      dropdownMenu.indexOf("function DropdownMenuContent"),
      dropdownMenu.indexOf("function DropdownMenuItem"),
    );
    const subContent = dropdownMenu.slice(
      dropdownMenu.indexOf("function DropdownMenuSubContent"),
      dropdownMenu.indexOf("export {"),
    );

    expect(content).toContain('align = "start"');
    expect(content).toContain("align={align}");
    expect(content).toContain("collisionPadding = 8");
    expect(content).toContain("collisionPadding={collisionPadding}");
    expect(content).toContain("w-max min-w-32");
    expect(content).toContain(
      "max-w-[min(20rem,var(--radix-dropdown-menu-content-available-width))]",
    );
    expect(content).toContain(
      "max-h-[var(--radix-dropdown-menu-content-available-height)]",
    );
    expect(content).toContain("overflow-x-hidden overflow-y-auto");
    expect(subContent).toContain("collisionPadding = 8");
    expect(subContent).toContain("collisionPadding={collisionPadding}");
    expect(subContent).toContain("w-max min-w-32");
    expect(subContent).toContain(
      "max-w-[min(20rem,var(--radix-dropdown-menu-content-available-width))]",
    );
    expect(subContent).toContain(
      "max-h-[var(--radix-dropdown-menu-content-available-height)]",
    );
    expect(subContent).toContain("overflow-x-hidden overflow-y-auto");
    expect(dropdownMenu).not.toContain("min-w-44");
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
    expect(input).toContain("hover:bg-subtle");
    expect(input).toContain("bg-elevated");
    expect(input).toContain("placeholder:text-dim");
    expect(textarea).toContain("hover:bg-subtle");
    expect(textarea).toContain("bg-elevated");
    expect(textarea).toContain("placeholder:text-dim");
    expect(select).toContain("focus-visible:ring-ring");
    expect(select).not.toContain("focus-visible:ring-ring/");
    expect(badge).toContain("text-success-text");
    expect(badge).toContain("text-destructive-text");
    expect(badge).not.toContain("bg-accent text-accent-foreground");
  });
});
