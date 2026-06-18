export type DialogCloseSource = "backdrop" | "escape" | "explicit";

export type DialogCloseDecision = "stay" | "close" | "confirm-discard";

export function resolveDialogClose({
  source,
  dirty,
}: {
  source: DialogCloseSource;
  dirty: boolean;
}): DialogCloseDecision {
  if (source !== "explicit") return "stay";
  return dirty ? "confirm-discard" : "close";
}
