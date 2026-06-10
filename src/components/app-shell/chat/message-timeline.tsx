import type { RefObject } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AssistantBlock, ChatMessage } from "./chat-types";

const messageHeader = "mb-2 flex items-center gap-2 text-[11px] text-dim";

const assistantBody =
  "text-sm leading-[1.72] text-primary [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_p]:my-[0.7em] [&_ul]:my-[0.7em] [&_ol]:my-[0.7em] [&_blockquote]:my-[0.7em] [&_table]:my-[0.7em] [&_ul]:pl-[1.45rem] [&_ol]:pl-[1.45rem] [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-[3px] [&_code]:rounded [&_code]:border [&_code]:border-line [&_code]:bg-panel [&_code]:px-[0.35em] [&_code]:py-[0.12em] [&_code]:font-ui-mono [&_code]:text-[0.88em] [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-[9px] [&_pre]:border [&_pre]:border-line [&_pre]:bg-[var(--tool-bg)] [&_pre]:px-3.5 [&_pre]:py-[13px] [&_pre_code]:border-0 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-line [&_th]:px-[9px] [&_th]:py-1.5 [&_th]:text-left [&_td]:border [&_td]:border-line [&_td]:px-[9px] [&_td]:py-1.5 [&_td]:text-left";

const detailsClass =
  "my-2.5 overflow-hidden rounded-[9px] border border-line bg-panel [&_summary]:flex [&_summary]:min-h-[38px] [&_summary]:cursor-pointer [&_summary]:list-none [&_summary]:items-center [&_summary]:gap-2 [&_summary]:px-[11px] [&_summary]:py-2 [&_summary]:font-ui-mono [&_summary]:text-[11px] [&_summary]:text-muted [&_summary]:select-none [&_summary::-webkit-details-marker]:hidden";

const detailsContent =
  "overflow-x-auto border-t border-line px-[13px] py-[11px] font-ui-mono text-[11px] leading-[1.65] whitespace-pre-wrap text-muted";

type MessageTimelineProps = {
  messages: ChatMessage[];
  running: boolean;
  scrollerRef: RefObject<HTMLDivElement | null>;
  streamingText: string;
};

export function MessageTimeline({
  messages,
  running,
  scrollerRef,
  streamingText,
}: MessageTimelineProps) {
  return (
    <div
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]"
      ref={scrollerRef}
    >
      <div className="mx-auto min-h-full w-full max-w-[820px] px-7 pt-[34px] pb-[190px] max-[640px]:px-[15px] max-[640px]:pt-[25px] max-[640px]:pb-[180px]">
        {messages.length === 0 && !streamingText ? <EmptyChat /> : null}

        {messages.map((message) => (
          <article className="relative mb-[30px]" key={message.id}>
            <MessageHeader
              role={message.role}
              timestamp={message.timestamp}
            />
            {message.role === "user" ? (
              <div className="ml-auto w-fit max-w-[min(88%,680px)] whitespace-pre-wrap rounded-[15px_15px_4px_15px] border border-[color-mix(in_srgb,var(--accent)_15%,var(--border))] bg-[var(--user-bg)] px-3.5 py-[11px] leading-[1.65] max-[640px]:max-w-[94%]">
                {message.content}
              </div>
            ) : (
              <AssistantContent blocks={message.content} />
            )}
          </article>
        ))}

        {running ? (
          <article className="relative mb-[30px]">
            <div className={messageHeader}>
              <span className="font-semibold tracking-[0.02em] text-muted">
                Pi
              </span>
              <span>Working</span>
            </div>
            <div className={assistantBody}>
              {streamingText ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {streamingText}
                </ReactMarkdown>
              ) : (
                <span className="text-muted">Thinking...</span>
              )}
              <span className="ml-[3px] inline-block h-[15px] w-[7px] animate-pulse rounded-[1px] bg-accent align-[-2px]" />
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
}

function EmptyChat() {
  return (
    <section className="grid min-h-[calc(100dvh-300px)] place-items-center text-center">
      <div>
        <div className="mx-auto mb-[18px] grid size-14 place-items-center rounded-[18px] border border-line bg-panel font-ui-mono text-[17px] font-bold text-accent shadow-[0_12px_30px_color-mix(in_srgb,var(--text)_7%,transparent)]">
          Pi
        </div>
        <h1 className="mb-2 text-[19px] font-semibold text-primary">
          What are we building?
        </h1>
        <p className="m-0 text-[13px] leading-6 text-muted">
          Ask a question, attach an image, or describe a task.
          <br />
          Enter sends. Shift + Enter adds a new line.
        </p>
      </div>
    </section>
  );
}

function MessageHeader({
  role,
  timestamp,
}: {
  role: "user" | "assistant";
  timestamp: number;
}) {
  return (
    <div
      className={`${messageHeader} ${
        role === "user" ? "justify-end" : ""
      }`}
    >
      <span className="font-semibold tracking-[0.02em] text-muted">
        {role === "user" ? "You" : "Pi"}
      </span>
      <time>
        {new Date(timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </time>
    </div>
  );
}

function AssistantContent({ blocks }: { blocks: AssistantBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === "text") {
          return (
            <div className={assistantBody} key={`text-${index}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {block.text}
              </ReactMarkdown>
            </div>
          );
        }

        if (block.type === "thinking") {
          return (
            <details className={detailsClass} key={`thinking-${index}`}>
              <summary>
                Thinking
                {block.duration ? <span> / {block.duration}</span> : null}
              </summary>
              <div className={detailsContent}>{block.thinking}</div>
            </details>
          );
        }

        return (
          <details className={detailsClass} key={block.toolCallId}>
            <summary>
              {block.toolName}
              <span className="ml-auto text-green-600">
                {block.isError ? "Failed" : block.result ? "Done" : "Running"}
              </span>
            </summary>
            <div className={detailsContent}>
              {JSON.stringify(block.input, null, 2)}
              {"\n\n"}
              {block.result ?? "(waiting for output)"}
            </div>
          </details>
        );
      })}
    </>
  );
}
