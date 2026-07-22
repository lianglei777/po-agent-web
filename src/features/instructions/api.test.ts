import { afterEach, describe, expect, it, vi } from "vitest";
import { getSystemInstructions } from "./api";
import { InstructionApiError } from "./types";

afterEach(() => vi.unstubAllGlobals());

describe("instructions api", () => {
  it("preserves the shared API error code and message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            success: false,
            error: {
              code: "INSTRUCTION_CONFLICT",
              message: "Instruction file changed",
            },
          },
          { status: 409 },
        ),
      ),
    );

    const error = await getSystemInstructions().catch((cause) => cause);

    expect(error).toBeInstanceOf(InstructionApiError);
    expect(error).toMatchObject({
      code: "INSTRUCTION_CONFLICT",
      message: "Instruction file changed",
      status: 409,
    });
  });
});
