import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(
    new URL("./model-provider-page.tsx", import.meta.url),
  ),
  "utf8",
);
const sidebarSource = readFileSync(
  fileURLToPath(
    new URL("./sidebar/model-provider-sidebar.tsx", import.meta.url),
  ),
  "utf8",
);
const controllerSource = readFileSync(
  fileURLToPath(new URL("./use-model-providers.ts", import.meta.url)),
  "utf8",
);

describe("Model Provider page", () => {
  it("reuses model configuration behavior without a top-level modal", () => {
    expect(source).toContain("useModelProviders");
    expect(source).toContain("ModelProviderSidebar");
    expect(source).toContain("onDirtyChange");
    expect(source).not.toContain("ModalOverlay");
    expect(source).not.toContain("<Dialog open");
  });

  it("keeps save feedback and nested detail components", () => {
    expect(source).toContain("modelConfig.save");
    expect(source).toContain("ProviderDetail");
    expect(source).toContain("ModelDetail");
    expect(source).toContain("OAuthDetail");
    expect(source).toContain("ApiKeyDetail");
  });

  it("does not expose manual model creation", () => {
    expect(source).not.toContain("onAddModel");
    expect(sidebarSource).not.toContain("onAddModel");
    expect(controllerSource).not.toMatch(/\baddModel\b/);
  });
});
