import type { ChangeEvent } from "react";
import { MODEL_OPTIONS } from "./chat-constants";
import type { ChatComposerProps } from "./chat-composer";
import { ChatIcon } from "./chat-icons";

const toolbarControl =
  "h-[29px] cursor-pointer rounded-md border-0 bg-transparent text-[11px] text-muted hover:bg-hover hover:text-primary";

type ComposerToolbarProps = Pick<
  ChatComposerProps,
  | "addFiles"
  | "canSubmit"
  | "fileInputRef"
  | "model"
  | "running"
  | "setModel"
  | "setThinking"
  | "setToolPreset"
  | "soundEnabled"
  | "stop"
  | "submit"
  | "thinking"
  | "toggleSound"
  | "toolPreset"
>;

export function ComposerToolbar({
  addFiles,
  canSubmit,
  fileInputRef,
  model,
  running,
  setModel,
  setThinking,
  setToolPreset,
  soundEnabled,
  stop,
  submit,
  thinking,
  toggleSound,
  toolPreset,
}: ComposerToolbarProps) {
  return (
    <div className="flex min-h-[42px] items-center gap-[5px] px-[7px] pt-[5px] pb-[7px]">
      <input
        accept="image/*"
        className="hidden"
        multiple
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          addFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
        ref={fileInputRef}
        type="file"
      />
      <button
        aria-label="Attach images"
        className={`${toolbarControl} inline-flex items-center gap-[5px] px-2`}
        onClick={() => fileInputRef.current?.click()}
        title="Attach images"
        type="button"
      >
        <ChatIcon name="attach" />
      </button>
      <select
        aria-label="Model"
        className={`${toolbarControl} max-w-[150px] px-[7px] outline-none max-[640px]:max-w-[105px]`}
        disabled={running}
        onChange={(event) => setModel(event.target.value)}
        value={model}
      >
        {MODEL_OPTIONS.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <select
        aria-label="Thinking level"
        className={`${toolbarControl} max-w-[150px] px-[7px] outline-none max-[640px]:hidden`}
        disabled={running}
        onChange={(event) => setThinking(event.target.value)}
        value={thinking}
      >
        <option value="auto">Thinking: Auto</option>
        <option value="off">Thinking: Off</option>
        <option value="low">Thinking: Low</option>
        <option value="medium">Thinking: Medium</option>
        <option value="high">Thinking: High</option>
      </select>
      <select
        aria-label="Tool preset"
        className={`${toolbarControl} max-w-[150px] px-[7px] outline-none max-[640px]:hidden`}
        disabled={running}
        onChange={(event) => setToolPreset(event.target.value)}
        value={toolPreset}
      >
        <option value="none">No tools</option>
        <option value="default">Default tools</option>
        <option value="full">All tools</option>
      </select>
      <button
        aria-label={soundEnabled ? "Disable sound" : "Enable sound"}
        aria-pressed={soundEnabled}
        className={`${toolbarControl} inline-flex items-center gap-[5px] px-2`}
        onClick={toggleSound}
        title={soundEnabled ? "Sound on" : "Sound off"}
        type="button"
      >
        <ChatIcon name="sound" />
      </button>
      <div className="flex-1" />

      {running ? (
        <RuntimeActions
          canSubmit={canSubmit}
          stop={stop}
          submit={submit}
        />
      ) : (
        <button
          aria-label="Send message"
          className="grid size-[31px] cursor-pointer place-items-center rounded-lg border-0 bg-accent text-white hover:bg-accent-hover disabled:cursor-default disabled:bg-hover disabled:text-dim"
          disabled={!canSubmit}
          onClick={() => submit()}
          type="button"
        >
          <ChatIcon name="send" />
        </button>
      )}
    </div>
  );
}

function RuntimeActions({
  canSubmit,
  stop,
  submit,
}: Pick<ChatComposerProps, "canSubmit" | "stop" | "submit">) {
  return (
    <div className="flex items-center gap-[5px]">
      <button
        className="inline-flex h-[30px] cursor-pointer items-center gap-1 rounded-[7px] border border-line bg-panel px-[9px] text-[11px] text-muted hover:bg-hover hover:text-primary disabled:cursor-default disabled:opacity-45"
        disabled={!canSubmit}
        onClick={() => submit("followUp")}
        type="button"
      >
        Follow-up
      </button>
      <button
        className="inline-flex h-[30px] cursor-pointer items-center gap-1 rounded-[7px] border border-line bg-panel px-[9px] text-[11px] text-muted hover:bg-hover hover:text-primary disabled:cursor-default disabled:opacity-45"
        disabled={!canSubmit}
        onClick={() => submit("steer")}
        type="button"
      >
        Steer
      </button>
      <button
        aria-label="Stop agent"
        className="inline-flex h-[30px] cursor-pointer items-center gap-1 rounded-[7px] border border-[color-mix(in_srgb,#dc2626_35%,var(--border))] bg-panel px-[9px] text-[11px] text-red-600 hover:bg-hover disabled:cursor-default disabled:opacity-45"
        onClick={stop}
        type="button"
      >
        <ChatIcon name="stop" size={12} /> Stop
      </button>
    </div>
  );
}
