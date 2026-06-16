"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  computeMessageTopRatio,
  computeTooltipPositions,
  computeViewportGeometry,
  dragOffsetForPointer,
  findNearestNode,
  pointerRatioFromClientY,
  scrollTopForViewportRatio,
  TOOLTIP_HEIGHT,
  type MinimapMessageEntry,
  type MinimapNodeInfo,
} from "./minimap-logic";

type Metrics = {
  visible: boolean;
  scrollRatio: number;
  viewportRatio: number;
  viewportTopRatio: number;
};

const INITIAL_METRICS: Metrics = {
  visible: false,
  scrollRatio: 0,
  viewportRatio: 1,
  viewportTopRatio: 0,
};

export function ChatMinimap({
  scroller,
  content,
  messages,
  messageElementsRef,
}: {
  scroller: HTMLDivElement | null;
  content: HTMLDivElement | null;
  messages: MinimapMessageEntry[];
  messageElementsRef: React.RefObject<Map<string, HTMLElement>>;
}) {
  const [nodes, setNodes] = useState<MinimapNodeInfo[]>([]);
  const [metrics, setMetrics] = useState<Metrics>(INITIAL_METRICS);
  const [hovered, setHovered] = useState(false);
  const [mouseYRatio, setMouseYRatio] = useState<number | null>(null);
  const [minimapHeight, setMinimapHeight] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    scrollerRef.current = scroller;
  }, [scroller]);

  const measure = useCallback(() => {
    if (!scroller) {
      setMetrics(INITIAL_METRICS);
      setNodes([]);
      return;
    }

    const viewport = computeViewportGeometry({
      clientHeight: scroller.clientHeight,
      scrollHeight: scroller.scrollHeight,
      scrollTop: scroller.scrollTop,
    });
    setMetrics(viewport);
    setMinimapHeight(trackRef.current?.clientHeight ?? scroller.clientHeight);

    const containerRect = scroller.getBoundingClientRect();
    const nextNodes = messages.flatMap((message, index) => {
      if (!message.showNode) return [];
      const element = messageElementsRef.current?.get(message.id);
      if (!element || scroller.scrollHeight <= 0) return [];

      const elementRect = element.getBoundingClientRect();
      return [
        {
          id: message.id,
          role: message.role,
          preview: message.preview,
          topRatio: computeMessageTopRatio({
            containerTop: containerRect.top,
            elementTop: elementRect.top,
            scrollHeight: scroller.scrollHeight,
            scrollTop: scroller.scrollTop,
          }),
          heightRatio: elementRect.height / scroller.scrollHeight,
          index,
        },
      ];
    });

    setNodes(nextNodes);
  }, [messageElementsRef, messages, scroller]);

  const scheduleMeasure = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      measure();
    });
  }, [measure]);

  useEffect(() => {
    if (!scroller) return;

    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(scroller);
    if (content) observer.observe(content);

    scroller.addEventListener("scroll", scheduleMeasure, { passive: true });
    scheduleMeasure();

    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", scheduleMeasure);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [content, scheduleMeasure, scroller]);

  useEffect(() => {
    const timer = window.setTimeout(scheduleMeasure, 50);
    return () => window.clearTimeout(timer);
  }, [messages.length, scheduleMeasure]);

  useEffect(() => {
    return () => {
      draggingRef.current = false;
    };
  }, []);

  const scrollToViewportTopRatio = useCallback(
    (viewportTopRatio: number) => {
      const element = scrollerRef.current;
      if (!element) return;
      element.scrollTop = scrollTopForViewportRatio({
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        viewportRatio: metrics.viewportRatio,
        viewportTopRatio,
      });
      scheduleMeasure();
    },
    [metrics.viewportRatio, scheduleMeasure],
  );

  const nearestIndex = useMemo(
    () => findNearestNode(nodes, mouseYRatio),
    [mouseYRatio, nodes],
  );
  const tooltipPositions = useMemo(
    () => computeTooltipPositions(nodes, minimapHeight || 600),
    [minimapHeight, nodes],
  );

  if (!metrics.visible || !scroller) return null;

  return (
    <div
      aria-label="Conversation minimap"
      className="relative w-9 flex-shrink-0 touch-none select-none overflow-visible border-l border-line bg-panel/85"
      onPointerCancel={(event) => {
        draggingRef.current = false;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        const pointerRatio = pointerRatioFromClientY({
          clientY: event.clientY,
          trackHeight: rect.height,
          trackTop: rect.top,
        });
        const offset = dragOffsetForPointer({
          pointerRatio,
          scrollRatio: metrics.scrollRatio,
          viewportRatio: metrics.viewportRatio,
        });
        dragOffsetRef.current = offset;
        draggingRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        scrollToViewportTopRatio(pointerRatio - offset);
      }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => {
        if (draggingRef.current) return;
        setHovered(false);
        setMouseYRatio(null);
      }}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const pointerRatio = pointerRatioFromClientY({
          clientY: event.clientY,
          trackHeight: rect.height,
          trackTop: rect.top,
        });
        setMouseYRatio(pointerRatio);
        if (draggingRef.current) {
          scrollToViewportTopRatio(pointerRatio - dragOffsetRef.current);
        }
      }}
      onPointerUp={(event) => {
        draggingRef.current = false;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      ref={trackRef}
      role="presentation"
    >
      <div className="absolute top-0 bottom-0 left-1/2 z-0 w-px -translate-x-1/2 bg-line" />
      <div
        className="pointer-events-none absolute right-0 left-0 z-10 border-y border-neutral-500/20 bg-neutral-500/10"
        style={{
          height: `${metrics.viewportRatio * 100}%`,
          top: `${metrics.viewportTopRatio * 100}%`,
        }}
      />

      {nodes.map((node, index) => {
        const nearest = index === nearestIndex;
        return (
          <span
            className="absolute right-0 left-0 z-20 flex h-3 -translate-y-1/2 cursor-pointer items-center justify-center"
            key={node.id}
            style={{ top: `${node.topRatio * 100}%` }}
          >
            <span
              className={
                node.role === "user"
                  ? "size-2 flex-shrink-0 rounded-[2px] border-[1.5px] border-blue-600/70 bg-blue-600/20 transition-transform"
                  : "size-1.5 flex-shrink-0 rounded-full border-[1.5px] border-gray-500/50 bg-gray-500/15 transition-transform"
              }
              style={{ transform: nearest ? "scale(1.6)" : "scale(1)" }}
            />
          </span>
        );
      })}

      {hovered
        ? nodes.map((node, index) => {
            if (!node.preview) return null;
            const nearest = index === nearestIndex;
            const roleBorder =
              node.role === "user"
                ? "rgba(37, 99, 235, 0.7)"
                : "rgba(107, 114, 128, 0.5)";

            return (
              <div
                className="pointer-events-none absolute right-full z-[100] mr-1.5 w-[200px] rounded border-y border-r bg-panel px-[7px] text-[11px] leading-[18px] transition-[top,opacity]"
                key={`${node.id}-tooltip`}
                style={{
                  borderLeftColor: roleBorder,
                  borderLeftStyle: "solid",
                  borderLeftWidth: 2,
                  borderBottomColor: nearest ? roleBorder : "var(--border)",
                  borderRightColor: nearest ? roleBorder : "var(--border)",
                  borderTopColor: nearest ? roleBorder : "var(--border)",
                  height: TOOLTIP_HEIGHT,
                  opacity: nearest ? 1 : 0.45,
                  top: tooltipPositions[index] ?? 0,
                }}
              >
                <div
                  className={`truncate ${nearest ? "text-primary" : "text-muted"}`}
                >
                  {node.preview}
                </div>
              </div>
            );
          })
        : null}
    </div>
  );
}
