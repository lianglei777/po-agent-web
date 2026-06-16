export type MinimapRole = "user" | "assistant" | "other";

export type MinimapMessageEntry = {
  id: string;
  role: Exclude<MinimapRole, "other">;
  preview: string;
  showNode: boolean;
};

export interface MinimapMessageAdapter<TMessage> {
  getKey(message: TMessage, index: number): string;
  getRole(message: TMessage): MinimapRole;
  getPreview(message: TMessage): string;
  shouldShowNode(message: TMessage): boolean;
}

export type MinimapNodeInfo = {
  id: string;
  role: Exclude<MinimapRole, "other">;
  preview: string;
  topRatio: number;
  heightRatio: number;
  index: number;
};

export const TOOLTIP_HEIGHT = 22;
export const TOOLTIP_GAP = 2;

type ViewportMetrics = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
};

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function adaptMinimapMessages<TMessage>(
  messages: TMessage[],
  adapter: MinimapMessageAdapter<TMessage>,
): MinimapMessageEntry[] {
  return messages.flatMap((message, index) => {
    const role = adapter.getRole(message);
    if (role !== "user" && role !== "assistant") return [];
    const preview = adapter.getPreview(message);
    return [
      {
        id: adapter.getKey(message, index),
        role,
        preview,
        showNode: adapter.shouldShowNode(message),
      },
    ];
  });
}

export function computeViewportGeometry({
  scrollTop,
  scrollHeight,
  clientHeight,
}: ViewportMetrics) {
  if (scrollHeight <= 0) {
    return {
      visible: false,
      scrollRatio: 0,
      viewportRatio: 1,
      viewportTopRatio: 0,
    };
  }

  const scrollable = scrollHeight - clientHeight;
  const viewportRatio = clamp(clientHeight / scrollHeight, 0, 1);
  const scrollRatio =
    scrollable > 0 ? clamp(scrollTop / scrollable, 0, 1) : 0;

  return {
    visible: scrollable > 20,
    scrollRatio,
    viewportRatio,
    viewportTopRatio: scrollRatio * (1 - viewportRatio),
  };
}

export function computeMessageTopRatio({
  elementTop,
  containerTop,
  scrollTop,
  scrollHeight,
}: {
  elementTop: number;
  containerTop: number;
  scrollTop: number;
  scrollHeight: number;
}) {
  if (scrollHeight <= 0) return 0;
  return clamp((elementTop - containerTop + scrollTop) / scrollHeight, 0, 1);
}

export function scrollTopForViewportRatio({
  viewportTopRatio,
  viewportRatio,
  scrollHeight,
  clientHeight,
}: {
  viewportTopRatio: number;
  viewportRatio: number;
  scrollHeight: number;
  clientHeight: number;
}) {
  const scrollable = scrollHeight - clientHeight;
  if (scrollable <= 0 || viewportRatio >= 1) return 0;
  const clamped = clamp(viewportTopRatio, 0, 1 - viewportRatio);
  return (clamped / (1 - viewportRatio)) * scrollable;
}

export function pointerRatioFromClientY({
  clientY,
  trackTop,
  trackHeight,
}: {
  clientY: number;
  trackTop: number;
  trackHeight: number;
}) {
  if (trackHeight <= 0) return 0;
  return clamp((clientY - trackTop) / trackHeight, 0, 1);
}

export function dragOffsetForPointer({
  pointerRatio,
  scrollRatio,
  viewportRatio,
}: {
  pointerRatio: number;
  scrollRatio: number;
  viewportRatio: number;
}) {
  const viewportTopRatio = scrollRatio * (1 - viewportRatio);
  const grabOffset = pointerRatio - viewportTopRatio;
  return grabOffset >= 0 && grabOffset <= viewportRatio
    ? grabOffset
    : viewportRatio / 2;
}

export function findNearestNode(
  nodes: Array<Pick<MinimapNodeInfo, "topRatio" | "index">>,
  mouseYRatio: number | null,
) {
  if (mouseYRatio === null || nodes.length === 0) return null;
  return nodes.reduce((bestIndex, node, currentIndex) => {
    const best = nodes[bestIndex];
    const currentDistance = Math.abs(node.topRatio - mouseYRatio);
    const bestDistance = Math.abs(best.topRatio - mouseYRatio);
    return currentDistance < bestDistance ? currentIndex : bestIndex;
  }, 0);
}

export function computeTooltipPositions(
  nodes: Array<Pick<MinimapNodeInfo, "topRatio">>,
  minimapHeightPx: number,
  options: {
    tooltipHeight?: number;
    gap?: number;
    passes?: number;
  } = {},
) {
  const tooltipHeight = options.tooltipHeight ?? TOOLTIP_HEIGHT;
  const gap = options.gap ?? TOOLTIP_GAP;
  const passes = options.passes ?? 10;
  const maxTop = Math.max(0, minimapHeightPx - tooltipHeight);
  const positions = nodes.map((node) =>
    Math.round(node.topRatio * minimapHeightPx - tooltipHeight / 2),
  );

  for (let pass = 0; pass < passes; pass += 1) {
    for (let index = 1; index < positions.length; index += 1) {
      const minTop = positions[index - 1] + tooltipHeight + gap;
      if (positions[index] < minTop) positions[index] = minTop;
    }

    for (let index = positions.length - 2; index >= 0; index -= 1) {
      const previousTop = positions[index + 1] - tooltipHeight - gap;
      if (positions[index] > previousTop) positions[index] = previousTop;
    }
  }

  return positions.map((position) => clamp(position, 0, maxTop));
}

export function selectTooltipWindow<TItem>(
  items: TItem[],
  nearestIndex: number | null,
  maxItems = 80,
) {
  if (items.length <= maxItems) {
    return items.map((item, index) => ({ item, index }));
  }

  if (nearestIndex === null) {
    return items.slice(0, maxItems).map((item, index) => ({ item, index }));
  }

  const halfWindow = Math.floor(maxItems / 2);
  const start = clamp(nearestIndex - halfWindow, 0, items.length - maxItems);
  return items
    .slice(start, start + maxItems)
    .map((item, offset) => ({ item, index: start + offset }));
}

export function isElementVerticallyVisible(
  element: Pick<DOMRect, "top" | "bottom">,
  viewport: Pick<DOMRect, "top" | "bottom">,
  minimumVisiblePx = 8,
) {
  const visibleHeight =
    Math.min(element.bottom, viewport.bottom) -
    Math.max(element.top, viewport.top);

  return visibleHeight >= minimumVisiblePx;
}
