import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const chatCenter = readFileSync(
  fileURLToPath(new URL("./chat-center.tsx", import.meta.url)),
  "utf8",
);
const welcomeStylesPath = fileURLToPath(
  new URL("./welcome.module.css", import.meta.url),
);
const welcomeStyles = existsSync(welcomeStylesPath)
  ? readFileSync(welcomeStylesPath, "utf8")
  : "";
const en = readFileSync(
  fileURLToPath(new URL("../../i18n/dictionaries/en.ts", import.meta.url)),
  "utf8",
);
const zh = readFileSync(
  fileURLToPath(new URL("../../i18n/dictionaries/zh.ts", import.meta.url)),
  "utf8",
);

describe("chat welcome visual contract", () => {
  it("uses one installed DavidHDev React Bits text effect, not a poster background", () => {
    expect(chatCenter).toContain('from "@/components/react-bits/blur-text"');
    expect(chatCenter).toContain("<BlurText");
    expect(chatCenter).not.toContain("<LetterGlitch");
    expect(chatCenter).not.toContain("<TextType");
    expect(chatCenter).not.toContain("function WelcomeBlurText");
    expect(chatCenter).not.toContain("react-bits inspired");
    expect(chatCenter).not.toContain("starterPrompts");
    expect(chatCenter).not.toContain("onSelectPrompt");
  });

  it("lets the empty welcome use the full chat surface, not the message column", () => {
    expect(chatCenter).toContain(
      'hasConversation ? "mx-auto max-w-[820px]" : ""',
    );
    expect(chatCenter).toContain("styles.stage");
    expect(chatCenter).toContain("aria-hidden=\"true\"");
    expect(chatCenter).toContain("pointer-events-none");
  });

  it("removes tag copy and keeps only the localized brand headline", () => {
    for (const source of [en, zh]) {
      expect(source).toContain("welcome:");
      expect(source).toContain("headline:");
      expect(source).not.toContain("statusReady:");
      expect(source).not.toContain("typeLine:");
    }
  });

  it("styles the headline as an integrated cyberpunk surface", () => {
    expect(welcomeStyles).toContain(".stage");
    expect(welcomeStyles).toContain(".terminalMark");
    expect(welcomeStyles).toContain(".neonTitle");
    expect(welcomeStyles).toContain("text-shadow:");
    expect(welcomeStyles).toContain("@keyframes welcome-slice");
    expect(welcomeStyles).not.toContain("font-size: clamp(72px");
    expect(welcomeStyles).not.toContain("repeating-linear-gradient");
    expect(welcomeStyles).not.toContain("letter-spacing: -");
  });
});
