export function FilePanel() {
  return (
    <div className="flex h-full w-[42vw] min-w-[300px] flex-col max-[640px]:w-screen max-[640px]:min-w-0">
      <div className="flex h-9 flex-none items-center border-b border-line bg-panel px-3 text-[11px] text-muted">
        Files
      </div>
      <div className="grid flex-1 place-items-center text-xs text-dim">
        No file open
      </div>
    </div>
  );
}

