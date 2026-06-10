import { LayersIcon, RefreshIcon } from "@/components/icons";

const neutralButton =
  "cursor-pointer bg-transparent text-muted hover:bg-hover hover:text-primary";

export function SessionSidebar() {
  return (
    <div className="flex h-full w-[260px] flex-col max-[640px]:w-[min(280px,85vw)]">
      <div className="flex items-center gap-1.5 px-2.5 pt-3 pb-2.5">
        <div className="min-w-0 flex-1 overflow-hidden font-ui-mono text-[13px] font-semibold whitespace-nowrap text-primary">
          Pi Agent Web
        </div>
        <button
          className="flex h-8 w-[65px] cursor-pointer items-center justify-center gap-1 rounded-md bg-accent text-xs font-semibold text-white disabled:cursor-not-allowed disabled:border disabled:border-line disabled:bg-hover disabled:text-dim"
          disabled
          type="button"
        >
          <span
            aria-hidden="true"
            className="text-[19px] leading-none font-normal"
          >
            +
          </span>
          New
        </button>
        <button
          aria-label="Refresh sessions"
          className={`${neutralButton} grid size-8 place-items-center rounded-[5px] border border-line bg-hover`}
          title="Refresh sessions"
          type="button"
        >
          <RefreshIcon size={15} />
        </button>
      </div>

      <button
        className="mx-2.5 mb-2 flex h-8 cursor-pointer items-center rounded-md border border-line bg-transparent px-2.5 text-left font-ui-mono text-[11px] text-muted hover:bg-hover hover:text-primary"
        type="button"
      >
        <span>Select project...</span>
      </button>

      <div className="min-h-20 flex-[1_1_50%] overflow-y-auto border-t border-line px-3 py-3.5">
        <span className="text-[11px] text-dim">Loading...</span>
      </div>

      <div className="flex gap-1.5 p-2">
        <button
          className={`${neutralButton} flex h-8 flex-1 items-center justify-center gap-1 rounded-md text-xs`}
          type="button"
        >
          <LayersIcon size={14} />
          Models
        </button>
        <button
          className={`${neutralButton} flex h-8 flex-1 items-center justify-center gap-1 rounded-md text-xs disabled:cursor-not-allowed disabled:opacity-35`}
          disabled
          type="button"
        >
          <LayersIcon size={14} />
          Skills
        </button>
      </div>
    </div>
  );
}

