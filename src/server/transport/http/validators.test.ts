import { describe, expect, it } from "vitest";
import {
  parseAgentCommand,
  parseCreateAgent,
  parseSkillInstall,
} from "./validators";

describe("agent HTTP validation", () => {
  it("accepts an image-only new session", () => {
    expect(
      parseCreateAgent({
        cwd: "C:\\work",
        message: "",
        images: [{ type: "image", data: "abc", mimeType: "image/png" }],
      }),
    ).toMatchObject({
      cwd: "C:\\work",
      message: "",
      images: [{ data: "abc", mimeType: "image/png" }],
    });
  });

  it("accepts image-only steer but rejects an empty command", () => {
    expect(
      parseAgentCommand({
        type: "steer",
        message: "",
        images: [{ type: "image", data: "abc", mimeType: "image/png" }],
      }),
    ).toMatchObject({ type: "steer", message: "" });
    expect(() =>
      parseAgentCommand({ type: "prompt", message: "", images: [] }),
    ).toThrow("message or images must be provided");
  });

  it("accepts the skills market package contract", () => {
    expect(
      parseSkillInstall({
        package: "owner/repo@demo",
        scope: "project",
        cwd: "C:\\work",
      }),
    ).toEqual({
      packageSpec: "owner/repo@demo",
      scope: "project",
      cwd: "C:\\work",
    });
  });
});
