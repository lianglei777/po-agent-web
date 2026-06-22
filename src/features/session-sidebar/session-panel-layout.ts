export const SESSION_PANEL_MIN = 80;
export const FILE_EXPLORER_MIN = 120;
export const SPLIT_HANDLE_SIZE = 1;
const DEFAULT_SESSION_PANEL_RATIO = 0.6;

export function getSessionPanelBounds(regionHeight: number) {
  const max = Math.max(
    0,
    regionHeight - FILE_EXPLORER_MIN - SPLIT_HANDLE_SIZE,
  );
  return {
    min: Math.min(SESSION_PANEL_MIN, max),
    max,
  };
}

export function resolveSessionPanelHeight(
  currentHeight: number | null,
  regionHeight: number,
) {
  const bounds = getSessionPanelBounds(regionHeight);
  const preferredHeight =
    currentHeight ?? Math.round(regionHeight * DEFAULT_SESSION_PANEL_RATIO);
  return Math.min(bounds.max, Math.max(bounds.min, preferredHeight));
}
