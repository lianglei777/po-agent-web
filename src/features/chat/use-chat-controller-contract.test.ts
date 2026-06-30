import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("./use-chat-controller.ts", import.meta.url)),
  "utf8",
);

describe("chat runtime state synchronization", () => {
  it("restores runtime state when an opened session is not loaded", () => {
    expect(source).toContain('type: "get_state"');
    expect(source).toContain("syncRuntimeState(runtimeState)");
  });
});
