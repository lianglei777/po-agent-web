import type {
  AgentMessage,
  AssistantMessage,
  TextContent,
  UserMessage,
} from "../agent-types";
import {
  adaptMinimapMessages,
  type MinimapMessageAdapter,
  type MinimapMessageEntry,
  type MinimapRole,
} from "./minimap-logic";

const PREVIEW_LIMIT = 200;

export function createChatMinimapEntries({
  messages,
  entryIds,
  streamingMessage,
}: {
  messages: AgentMessage[];
  entryIds: string[];
  streamingMessage: Partial<AssistantMessage> | null;
}): MinimapMessageEntry[] {
  const persisted = adaptMinimapMessages(
    messages.map((message, index) => ({
      entryId: entryIds[index],
      index,
      message,
    })),
    chatMessageAdapter,
  );

  if (!streamingMessage) return persisted;
  const streamingPreview = assistantPreview({
    role: "assistant",
    content: streamingMessage.content ?? [],
    provider: streamingMessage.provider ?? "",
    model: streamingMessage.model ?? "",
  });

  return [
    ...persisted,
    {
      id: "streaming-assistant",
      preview: streamingPreview,
      role: "assistant",
      showNode: streamingPreview.length > 0,
    },
  ];
}

const chatMessageAdapter: MinimapMessageAdapter<{
  message: AgentMessage;
  index: number;
  entryId?: string;
}> = {
  getKey(item) {
    const { message, index, entryId } = item;
    if (entryId) return entryId;
    if (message.role === "user" && message.clientId) return message.clientId;
    const timestamp =
      "timestamp" in message && typeof message.timestamp === "number"
        ? message.timestamp
        : "untimed";
    return `${message.role}-${timestamp}-${index}`;
  },
  getRole(item) {
    return minimapRole(item.message);
  },
  getPreview(item) {
    return getChatMessagePreview(item.message);
  },
  shouldShowNode(item) {
    const role = minimapRole(item.message);
    const preview = getChatMessagePreview(item.message);
    return role === "user" || (role === "assistant" && preview.length > 0);
  },
};

export function minimapRole(message: AgentMessage): MinimapRole {
  return message.role === "user" || message.role === "assistant"
    ? message.role
    : "other";
}

export function getChatMessagePreview(message: AgentMessage): string {
  if (message.role === "user") return userPreview(message);
  if (message.role === "assistant") return assistantPreview(message);
  return "";
}

function userPreview(message: UserMessage) {
  if (typeof message.content === "string") {
    return message.content.slice(0, PREVIEW_LIMIT);
  }

  return message.content
    .filter((block): block is TextContent => block.type === "text" && Boolean(block.text))
    .map((block) => block.text)
    .join("\n")
    .slice(0, PREVIEW_LIMIT);
}

function assistantPreview(message: AssistantMessage) {
  const text = message.content
    .filter((block): block is TextContent => block.type === "text" && Boolean(block.text))
    .map((block) => block.text)
    .join(" ");

  if (text) return text.slice(0, PREVIEW_LIMIT);

  const tools = message.content
    .filter((block) => block.type === "toolCall")
    .map((block) => block.toolName);

  return tools.join(", ").slice(0, PREVIEW_LIMIT);
}
