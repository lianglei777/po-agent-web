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
  it("exposes the three approved feature cards", () => {
    expect(chatSource).toContain("ServerCog");
    expect(chatSource).toContain("Puzzle");
    expect(chatSource).toContain("MessageSquarePlus");
    expect(chatSource).toContain("t.chat.welcome.modelDescription");
    expect(chatSource).toContain("t.chat.welcome.skillsDescription");
    expect(chatSource).toContain("t.chat.welcome.sessionDescription");
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
  });
});
