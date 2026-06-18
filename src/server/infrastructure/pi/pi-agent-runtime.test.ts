import { describe, expect, it } from "vitest";
import { mapEvents } from "./pi-agent-runtime";

describe("mapEvents", () => {
  it("emits a structured agent error after an errored assistant message", () => {
    const events = mapEvents({
      type: "message_end",
      message: {
        role: "assistant",
        content: [],
        api: "openai-completions",
        provider: "custom",
        model: "deepseek-v4-pro",
        stopReason: "error",
        errorMessage: "400 unsupported developer role",
        usage: {
          input: 0,
          output: 0,
          cacheRead: 0,
          cacheWrite: 0,
          totalTokens: 0,
          cost: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            total: 0,
          },
        },
        timestamp: 1,
      },
    });

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      type: "message_end",
      message: {
        role: "assistant",
        failure: { code: "MODEL_PROTOCOL_ERROR" },
      },
    });
    expect(events[1]).toMatchObject({
      type: "agent_error",
      error: {
        code: "MODEL_PROTOCOL_ERROR",
        provider: "custom",
        model: "deepseek-v4-pro",
      },
    });
  });
});
