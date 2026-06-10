import {
  MoonIcon,
  PanelLeftIcon,
  SunIcon,
} from "@/components/icons";

export type TopPanel = "branches" | "system" | null;

const neutralButton =
  "cursor-pointer bg-transparent text-muted hover:bg-hover hover:text-primary";

type AppTopBarProps = {
  dark: boolean;
  sessionIsActive: boolean;
  sidebarOpen: boolean;
  topPanel: TopPanel;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
  onToggleTopPanel: (panel: Exclude<TopPanel, null>) => void;
};

export function AppTopBar({
  dark,
  sessionIsActive,
  sidebarOpen,
  topPanel,
  onToggleSidebar,
  onToggleTheme,
  onToggleTopPanel,
}: AppTopBarProps) {
  return (
    <>
      <header className="flex h-9 flex-none items-stretch border-b border-line bg-panel pr-12">
        <button
          aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          aria-pressed={sidebarOpen}
          className={`${neutralButton} grid size-9 flex-none place-items-center border-r border-line`}
          onClick={onToggleSidebar}
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          type="button"
        >
          <PanelLeftIcon showExpandIndicator={!sidebarOpen} />
        </button>
        <button
          aria-label={dark ? "Use light theme" : "Use dark theme"}
          aria-pressed={dark}
          className={`${neutralButton} grid size-9 flex-none place-items-center border-r border-line`}
          onClick={onToggleTheme}
          title={dark ? "Use light theme" : "Use dark theme"}
          type="button"
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </button>
        {sessionIsActive ? (
          <>
            <div className="mx-1 h-[18px] w-px self-center bg-line" />
            <TopPanelButton
              active={topPanel === "branches"}
              label="Branches"
              onClick={() => onToggleTopPanel("branches")}
            />
            <TopPanelButton
              active={topPanel === "system"}
              label="System"
              onClick={() => onToggleTopPanel("system")}
            />
          </>
        ) : null}
        <div className="flex-1" />
      </header>

      {topPanel ? (
        <section
          className="absolute top-9 left-0 z-500 flex min-h-24 w-full items-center justify-center border-b border-line bg-panel text-xs text-dim shadow-[0_6px_20px_rgba(0,0,0,0.1)]"
          data-testid="top-panel"
        >
          <span>
            {topPanel === "branches"
              ? "No branches in this session"
              : "No system prompt available"}
          </span>
        </section>
      ) : null}
    </>
  );
}

function TopPanelButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-expanded={active}
      className={`relative h-9 cursor-pointer border-t-2 px-2.5 text-[11px] ${
        active
          ? "border-accent bg-selected text-primary"
          : "border-transparent bg-transparent text-muted hover:bg-hover hover:text-primary"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

