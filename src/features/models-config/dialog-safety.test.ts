import { describe, expect, test } from "vitest";
import { resolveDialogClose } from "./dialog-safety";

describe("resolveDialogClose", () => {
  test("ignores backdrop and escape close attempts", () => {
    expect(resolveDialogClose({ source: "backdrop", dirty: false })).toBe(
      "stay",
    );
    expect(resolveDialogClose({ source: "escape", dirty: false })).toBe(
      "stay",
    );
  });

  test("closes clean dialogs only through explicit actions", () => {
    expect(resolveDialogClose({ source: "explicit", dirty: false })).toBe(
      "close",
    );
  });

  test("requires discard confirmation for dirty dialogs", () => {
    expect(resolveDialogClose({ source: "explicit", dirty: true })).toBe(
      "confirm-discard",
    );
  });
});
