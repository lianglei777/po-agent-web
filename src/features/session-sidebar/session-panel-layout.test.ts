import { describe, expect, it } from "vitest";
import {
  getSessionPanelBounds,
  resolveSessionPanelHeight,
} from "./session-panel-layout";

describe("session panel layout", () => {
  it("initializes the session panel to 60 percent within valid bounds", () => {
    expect(resolveSessionPanelHeight(null, 500)).toBe(300);
  });

  it("clamps an existing height when the available region shrinks", () => {
    expect(resolveSessionPanelHeight(360, 400)).toBe(279);
  });

  it("clamps values to the normal minimum and maximum", () => {
    expect(resolveSessionPanelHeight(20, 500)).toBe(80);
    expect(resolveSessionPanelHeight(450, 500)).toBe(379);
  });

  it("keeps bounds valid for an exceptionally short container", () => {
    expect(getSessionPanelBounds(100)).toEqual({ min: 0, max: 0 });
    expect(resolveSessionPanelHeight(null, 100)).toBe(0);
  });
});
