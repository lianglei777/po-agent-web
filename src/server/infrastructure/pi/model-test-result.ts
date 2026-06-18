type ModelTestEvaluation =
  | { ok: true; responseText: string }
  | { ok: false; error: string };

type AssistantLike = {
  role: "assistant";
  content?: unknown;
  stopReason?: unknown;
  errorMessage?: unknown;
};

export function evaluateModelTestMessages(
  messages: readonly unknown[],
): ModelTestEvaluation {
  const assistant = [...messages]
    .reverse()
    .find((message): message is AssistantLike => isAssistant(message));
  if (!assistant) {
    return { ok: false, error: "Model returned no assistant response" };
  }
  if (assistant.stopReason === "error") {
    return {
      ok: false,
      error:
        typeof assistant.errorMessage === "string" &&
        assistant.errorMessage.trim()
          ? assistant.errorMessage
          : "Model request failed",
    };
  }
  if (
    assistant.stopReason === "aborted" ||
    assistant.stopReason === "rejected"
  ) {
    return {
      ok: false,
      error: `Model request ended with ${assistant.stopReason}`,
    };
  }
  const responseText = textContent(assistant.content);
  return responseText
    ? { ok: true, responseText }
    : { ok: false, error: "Model returned no text output" };
}

function isAssistant(value: unknown): value is AssistantLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "role" in value &&
    value.role === "assistant"
  );
}

function textContent(content: unknown): string {
  if (!Array.isArray(content)) return "";
  return content
    .flatMap((block) => {
      if (
        typeof block === "object" &&
        block !== null &&
        "type" in block &&
        block.type === "text" &&
        "text" in block &&
        typeof block.text === "string"
      ) {
        return block.text;
      }
      return [];
    })
    .join("\n\n")
    .trim();
}
