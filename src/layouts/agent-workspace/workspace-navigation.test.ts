import { describe, expect, it } from "vitest";
import { shouldConfirmWorkspaceNavigation } from "./workspace-navigation";

describe("workspace navigation guard", () => {
  it("guards only dirty Model Provider navigation", () => {
    expect(
      shouldConfirmWorkspaceNavigation("model-provider", "chat", true),
    ).toBe(true);
    expect(
      shouldConfirmWorkspaceNavigation(
        "model-provider",
        "model-provider",
        true,
      ),
    ).toBe(false);
    expect(
      shouldConfirmWorkspaceNavigation("model-provider", "chat", false),
    ).toBe(false);
    expect(shouldConfirmWorkspaceNavigation("chat", "chat", true)).toBe(false);
  });
});
