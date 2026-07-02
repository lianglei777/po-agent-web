import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../../", import.meta.url));
const css = readFileSync(`${root}/src/app/globals.css`, "utf8");
const layout = readFileSync(`${root}/src/app/layout.tsx`, "utf8");
const designSidecar = readFileSync(
  `${root}/.impeccable/design.json`,
  "utf8",
);
const chatCenter = readFileSync(
  `${root}/src/features/chat/chat-center.tsx`,
  "utf8",
);
const chatInput = readFileSync(
  `${root}/src/features/chat/chat-input.tsx`,
  "utf8",
);
const messageView = readFileSync(
  `${root}/src/features/chat/message-view.tsx`,
  "utf8",
);
const topBar = readFileSync(
  `${root}/src/layouts/agent-workspace/workspace-top-bar.tsx`,
  "utf8",
);
const agentWorkspace = readFileSync(
  `${root}/src/layouts/agent-workspace/agent-workspace.tsx`,
  "utf8",
);

describe("visual foundation contract", () => {
  test("defines the approved Agent Mint tokens", () => {
    expect(css).toContain("--bg: #fbfbf8");
    expect(css).toContain("--bg-panel: #ffffff");
    expect(css).toContain("--bg-elevated: #ffffff");
    expect(css).toContain("--bg-selected: #e8f5ee");
    expect(css).toContain("--text: #0a0a0a");
    expect(css).toContain("--text-muted: #3f3f46");
    expect(css).toContain("--text-dim: #71717a");
    expect(css).toContain("--border-subtle: #e7e5df");
    expect(css).toContain("--border-strong: #c9c4b8");
    expect(css).toContain("--accent: #22e68a");
    expect(css).toContain("--accent-deep: #0d6b42");
    expect(css).toContain("--primary-foreground: #ffffff");

    // 暗色主题已被移除
    expect(css).not.toContain("html.dark");
    expect(css).not.toContain("color-scheme: dark");
  });

  test("registers approved display fonts without replacing the UI font", () => {
    expect(layout).toContain("Playfair_Display");
    expect(layout).toContain("Noto_Serif_SC");
    expect(layout).toContain("--font-display-latin");
    expect(layout).toContain("--font-display-cjk");
    expect(css).toContain("--font-display:");
  });

  test("defines reduced-motion fallback and shared motion durations", () => {
    expect(css).toContain("--motion-fast: 150ms");
    expect(css).toContain("--motion-standard: 200ms");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation-duration: 0.01ms");
  });

  test("applies the visual foundation to the chat sample", () => {
    expect(chatCenter).toContain("text-display");
    expect(topBar).toContain("truncate text-xs font-medium text-primary");
    expect(chatInput).not.toContain("rounded-[20px]");
    expect(chatInput).not.toContain("linear-gradient");
    expect(chatInput).toContain("rounded-lg");
    expect(messageView).toContain("border-line-subtle");
  });

  test("uses a quiet canvas with distinct panel surfaces", () => {
    expect(agentWorkspace).toContain("bg-panel");
    expect(agentWorkspace).toContain("bg-canvas");
    expect(topBar).toContain("border-line-subtle bg-panel");
    expect(chatInput).not.toContain("rounded-[14px]");
    expect(chatInput).not.toContain("shadow-[var(--shadow-composer)]");
  });

  test("enforces the desktop workspace floor", () => {
    expect(css).toContain("min-width: 1024px");
    expect(css).toContain("overflow-x: auto");
    expect(css).toContain("overflow-y: hidden");
  });

  test("keeps the design sidecar synchronized with the approved theme", () => {
    expect(designSidecar).toContain('"canonical": "#fbfbf8"');
    expect(designSidecar).toContain('"canonical": "#22e68a"');
    expect(designSidecar).toContain("Agent Mint");
    expect(designSidecar).not.toContain("Deep Focus");
    expect(designSidecar).not.toContain("Adaptive Workbench");
    expect(designSidecar).not.toContain("rounded-20px");
  });
});
