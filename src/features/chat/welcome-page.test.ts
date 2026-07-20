import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const chatSource = readFileSync(
  fileURLToPath(new URL("./chat-center.tsx", import.meta.url)),
  "utf8",
);
const styleSource = readFileSync(
  fileURLToPath(new URL("./welcome.module.css", import.meta.url)),
  "utf8",
);
const workspaceSource = readFileSync(
  fileURLToPath(
    new URL("../../layouts/agent-workspace/agent-workspace.tsx", import.meta.url),
  ),
  "utf8",
);

describe("welcome page", () => {
  it("exposes compact Codex-style quick actions without onboarding cards", () => {
    expect(chatSource).toContain("ServerCog");
    expect(chatSource).toContain("Puzzle");
    expect(chatSource).toContain("MessageSquarePlus");
    expect(chatSource).toContain("function WelcomeAction");
    expect(chatSource).not.toContain("function WelcomeCard");
    expect(styleSource).toContain(".actions");
    expect(styleSource).toContain(".actionButton");
    expect(styleSource).toContain("border-radius: var(--radius-md)");
    expect(styleSource).not.toContain(".cards");
    expect(styleSource).not.toContain("min-height: 176px");
  });

  it("uses runtime workspace and model state", () => {
    expect(chatSource).toContain("controller.models.length");
    expect(chatSource).toContain("controller.currentModel");
    expect(workspaceSource).toContain("onOpenModelProvider=");
    expect(workspaceSource).toContain("onOpenSkills=");
    expect(chatSource).not.toMatch(/GPT-?\d/i);
  });

  it("removes the decorative neon treatment", () => {
    expect(chatSource).not.toContain("neonSlice");
    expect(styleSource).not.toContain("linear-gradient");
    expect(styleSource).not.toContain("@keyframes");
    expect(styleSource).not.toContain("var(--font-display)");
  });
});
