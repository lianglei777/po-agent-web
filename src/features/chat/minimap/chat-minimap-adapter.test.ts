import { describe, expect, it } from "vitest";
import type { AgentMessage } from "../agent-types";
import {
  createChatMinimapEntries,
  getChatMessagePreview,
} from "./chat-minimap-adapter";

describe("chat minimap adapter", () => {
  it("extracts previews from user string and text blocks", () => {
    expect(
      getChatMessagePreview({
        role: "user",
        content: "hello",
      }),
    ).toBe("hello");
    expect(
      getChatMessagePreview({
        role: "user",
        content: [
          { type: "text", text: "first" },
          { type: "image", source: { type: "url", url: "https://example.test/a.png" } },
          { type: "text", text: "second" },
        ],
      }),
    ).toBe("first\nsecond");
  });

  it("keeps user image-only messages navigable without a tooltip preview", () => {
    const entries = createChatMinimapEntries({
      entryIds: ["entry-1"],
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "url", url: "https://example.test/a.png" } },
          ],
        },
      ],
      streamingMessage: null,
    });

    expect(entries).toEqual([
      {
        id: "entry-1",
        preview: "",
        role: "user",
        showNode: true,
      },
    ]);
  });

  it("extracts assistant text and pure tool-call previews", () => {
    expect(
      getChatMessagePreview({
        role: "assistant",
        content: [
          { type: "text", text: "one" },
          { type: "text", text: "two" },
        ],
        model: "model",
        provider: "provider",
      }),
    ).toBe("one two");

    expect(
      createChatMinimapEntries({
        entryIds: ["assistant-entry"],
        messages: [
          {
            role: "assistant",
            content: [
              {
                input: {},
                toolCallId: "tool-1",
                toolName: "shell_command",
                type: "toolCall",
              },
            ],
            model: "model",
            provider: "provider",
          },
        ],
        streamingMessage: null,
      }),
    ).toEqual([
      {
        id: "assistant-entry",
        preview: "shell_command",
        role: "assistant",
        showNode: true,
      },
    ]);
  });

  it("skips non-chat roles and truncates previews at 200 characters", () => {
    const longText = "x".repeat(250);
    const messages: AgentMessage[] = [
      {
        role: "toolResult",
        toolCallId: "tool-1",
        content: [{ type: "text", text: "hidden" }],
      },
      { role: "user", content: longText },
    ];

    expect(
      createChatMinimapEntries({
        entryIds: ["tool-entry", "user-entry"],
        messages,
        streamingMessage: null,
      }),
    ).toEqual([
      {
        id: "user-entry",
        preview: "x".repeat(200),
        role: "user",
        showNode: true,
      },
    ]);
  });

  it("adds a stable streaming assistant entry", () => {
    expect(
      createChatMinimapEntries({
        entryIds: [],
        messages: [],
        streamingMessage: {
          content: [{ type: "text", text: "streaming" }],
          model: "model",
          provider: "provider",
        },
      }),
    ).toEqual([
      {
        id: "streaming-assistant",
        preview: "streaming",
        role: "assistant",
        showNode: true,
      },
    ]);
  });
});
