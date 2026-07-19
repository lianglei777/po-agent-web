import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string) {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8",
  );
}

const modelSource = readSource("./model-detail.tsx");
const providerSource = readSource("./provider-detail.tsx");

describe("model provider detail layout", () => {
  it("keeps compatibility as the last information item", () => {
    expect(providerSource.indexOf("<CompatEditor")).toBeGreaterThan(
      providerSource.indexOf("<ModelDiscoveryPanel"),
    );
    expect(modelSource.lastIndexOf("<CompatEditor")).toBeGreaterThan(
      modelSource.indexOf("thinkingOnDefault"),
    );
  });

  it("does not render supported or unsupported status copy in capabilities", () => {
    expect(modelSource).not.toContain("t.models.supported");
    expect(modelSource).not.toContain("t.models.unsupported");
  });
});
