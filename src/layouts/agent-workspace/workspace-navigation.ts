export type WorkspaceView = "chat" | "model-provider" | "skills";

export function shouldConfirmWorkspaceNavigation(
  activeView: WorkspaceView,
  targetView: WorkspaceView,
  modelProviderDirty: boolean,
) {
  return (
    activeView === "model-provider" &&
    targetView !== activeView &&
    modelProviderDirty
  );
}
