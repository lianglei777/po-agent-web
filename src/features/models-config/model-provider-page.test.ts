import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(
    new URL("./components/model-provider-page.tsx", import.meta.url),
  ),
  "utf8",
);

describe("Model Provider page", () => {
  it("reuses model configuration behavior without a top-level modal", () => {
    expect(source).toContain("useModelsConfig");
    expect(source).toContain("ModelsConfigSidebar");
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
});
