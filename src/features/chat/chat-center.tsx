"use client";

import {
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { ImagePlus } from "lucide-react";
import BlurText from "@/components/react-bits/blur-text";
import { useI18n } from "@/i18n/use-i18n";
import { ChatInput } from "./chat-input";
import { createChatMinimapEntries } from "./minimap/chat-minimap-adapter";
import { ChatMinimap } from "./minimap/chat-minimap";
import { MessageList } from "./message-view";
import styles from "./welcome.module.css";
import type { ContextUsage, SessionStats, SessionTreeNode } from "./agent-types";
import {
  type ChatSession,
  useChatController,
} from "./use-chat-controller";

export type BranchState = {
  tree: SessionTreeNode[];
  activeLeafId: string | null;
  running: boolean;
  changeLeaf: (leafId: string) => Promise<boolean>;
};

export function ChatCenter({
  session,
  newSessionCwd,
  modelsRevision,
  onAgentEnd,
  onSessionCreated,
  onSessionForked,
  onSystemPromptChange,
  onSessionStatsChange,
  onContextUsageChange,
  onBranchState,
}: {
  session: ChatSession | null;
  newSessionCwd: string | null;
  modelsRevision: number;
  onAgentEnd?: () => void;
  onSessionCreated?: (sessionId: string) => void;
  onSessionForked?: (sessionId: string) => void;
  onSystemPromptChange?: (prompt: string | null) => void;
  onSessionStatsChange?: (stats: SessionStats | null) => void;
  onContextUsageChange?: (usage: ContextUsage | null) => void;
  onBranchState?: (state: BranchState | null) => void;
}) {
  const controller = useChatController({
    session,
    newSessionCwd,
    modelsRevision,
    onAgentEnd,
    onSessionCreated,
    onSessionForked,
    onSystemPromptChange,
    onSessionStatsChange,
    onContextUsageChange,
  });
  const { t } = useI18n();
  const [dragActive, setDragActive] = useState(false);
  const [scrollerNode, setScrollerNode] = useState<HTMLDivElement | null>(null);
  const [contentNode, setContentNode] = useState<HTMLDivElement | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  const [composerNode, setComposerNode] = useState<HTMLDivElement | null>(null);
  const [composerHeight, setComposerHeight] = useState(0);
  const dragCounter = useRef(0);
  const messageElementsRef = useRef<Map<string, HTMLElement>>(new Map());
  const { activeLeafId, changeLeaf, running, tree } = controller;

  const minimapEntries = useMemo(
    () =>
      createChatMinimapEntries({
        entryIds: controller.entryIds,
        messages: controller.messages,
        streamingMessage: controller.stream.streamingMessage,
      }),
    [
      controller.entryIds,
      controller.messages,
      controller.stream.streamingMessage,
    ],
  );
  const minimapViewportInsets = useMemo(
    () => ({ bottom: composerHeight }),
    [composerHeight],
  );

  const handleMessageElement = useCallback(
    (id: string, element: HTMLElement | null) => {
      if (element) messageElementsRef.current.set(id, element);
      else messageElementsRef.current.delete(id);
    },
    [],
  );

  // 将分支状态传递给 WorkspaceTopBar
  useEffect(() => {
    onBranchState?.({
      tree,
      activeLeafId,
      running,
      changeLeaf: (leafId) => changeLeaf(leafId),
    });
    return () => onBranchState?.(null);
  }, [activeLeafId, changeLeaf, onBranchState, running, tree]);

  useEffect(() => {
    if (!composerNode) return;

    const updateComposerHeight = () => {
      setComposerHeight(composerNode.getBoundingClientRect().height);
    };
    const observer = new ResizeObserver(updateComposerHeight);
    observer.observe(composerNode);
    const frame = window.requestAnimationFrame(updateComposerHeight);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [composerNode]);

  function hasImages(event: DragEvent<HTMLElement>) {
    return Array.from(event.dataTransfer.items).some(
      (item) => item.kind === "file" && item.type.startsWith("image/"),
    );
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    dragCounter.current = 0;
    setDragActive(false);
    void controller.addFiles(Array.from(event.dataTransfer.files));
  }

  const hasConversation =
    controller.messages.length > 0 ||
    controller.stream.streamingMessage ||
    controller.running;

  return (
    <main
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-canvas"
      onDragEnter={(event) => {
        if (!hasImages(event) || !controller.canAttachImages) return;
        event.preventDefault();
        dragCounter.current += 1;
        setDragActive(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        dragCounter.current -= 1;
        if (dragCounter.current <= 0) {
          dragCounter.current = 0;
          setDragActive(false);
        }
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      {dragActive ? (
        <div className="pointer-events-none absolute inset-3 z-40 grid place-items-center rounded-lg border-2 border-dashed border-line bg-hover">
          <div className="flex flex-col items-center gap-2 text-sm font-semibold text-muted">
            <ImagePlus className="size-8 text-muted" />
            {t.chat.dragDropImages}
          </div>
        </div>
      ) : null}

      {controller.loading ? (
        <CenteredState>{t.chat.loadingSession}</CenteredState>
      ) : controller.error ? (
        <CenteredState error>{controller.error}</CenteredState>
      ) : (
        <>
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="relative flex min-h-0 flex-1 overflow-hidden">
              <div
                className="min-w-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none]"
                ref={(node) => {
                  controller.setScrollerNode(node);
                  setScrollerNode(node);
                }}
              >
                <div
                  className={`min-h-full w-full px-4 pt-4 pb-[220px] ${
                    hasConversation ? "mx-auto max-w-[820px]" : ""
                  }`}
                  ref={(node) => {
                    controller.setContentNode(node);
                    setContentNode(node);
                  }}
                >
                  {!hasConversation ? <Welcome /> : null}

                  <MessageList
                    entryIds={controller.entryIds}
                    forkingEntryId={controller.forkingEntryId}
                    lastUserRef={controller.lastUserRef}
                    messages={controller.messages}
                    onEdit={(targetId, text) =>
                      void controller.editFromHere(targetId, text)
                    }
                    onFork={(entryId) => void controller.fork(entryId)}
                    highlightedMessageId={highlightedMessageId}
                    onMessageElement={handleMessageElement}
                    running={controller.running}
                    streamingMessage={controller.stream.streamingMessage}
                  />

                  {controller.running ? <div className="h-[80vh]" /> : null}
                </div>
              </div>

              <ChatMinimap
                content={contentNode}
                messageElementsRef={messageElementsRef}
                messages={minimapEntries}
                onHoverMessageChange={setHighlightedMessageId}
                scroller={scrollerNode}
                viewportInsets={minimapViewportInsets}
              />
            </div>
          </div>

          <ChatInput {...controller} rootRef={setComposerNode} />
        </>
      )}
    </main>
  );
}

function Welcome() {
  const { t } = useI18n();
  const reduceMotion = usePrefersReducedMotion();

  return (
    <section className={styles.stage}>
      <div className={styles.terminalMark}>
        <span aria-hidden="true" className={styles.neonSlice} />
        <div className={styles.titleStack}>
          <h1 className={styles.neonTitle}>{t.chat.welcome.headline}</h1>
          {!reduceMotion ? (
            <div aria-hidden="true" className={styles.bitsLayer}>
              <BlurText
                animateBy="letters"
                className={`${styles.neonTitle} ${styles.bitsTitle} justify-center`}
                delay={24}
                direction="bottom"
                text={t.chat.welcome.headline}
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  );
}

function subscribeReducedMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function CenteredState({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`grid flex-1 place-items-center text-sm ${error ? "text-destructive" : "text-muted"
        }`}
    >
      {children}
    </div>
  );
}
