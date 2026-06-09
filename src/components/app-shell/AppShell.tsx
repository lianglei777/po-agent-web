"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  LayersIcon,
  MoonIcon,
  PanelLeftIcon,
  PanelRightIcon,
  RefreshIcon,
  SunIcon,
} from "@/components/icons";
import styles from "./AppShell.module.css";

type TopPanel = "branches" | "system" | null;

const neutralButton =
  "cursor-pointer bg-transparent text-muted hover:bg-hover hover:text-primary";

function SessionSidebar() {
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

function ChatWindow() {
  return (
    <main className="min-h-0 flex-1 overflow-hidden">
      <div className="flex max-w-[560px] gap-[11px] p-2.5 text-muted">
        <div className="grid size-11 flex-none place-items-center text-accent">
          <ArrowLeftIcon size={44} />
        </div>
        <div>
          <h1 className="mt-px mb-3.5 text-lg font-semibold text-primary">
            Get Started
          </h1>
          <p className="my-2 text-[13px] leading-6">
            <strong className="font-normal text-accent">1.</strong> Select a
            project directory from the sidebar
          </p>
          <p className="my-2 text-[13px] leading-6">
            <strong className="font-normal text-accent">2.</strong> Add models
            via the <b className="text-primary">Models</b> button at the bottom
          </p>
        </div>
      </div>
    </main>
  );
}

function FilePanel() {
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

export function AppShell({
  hasActiveSession = false,
}: {
  hasActiveSession?: boolean;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filePanelOpen, setFilePanelOpen] = useState(false);
  const [topPanel, setTopPanel] = useState<TopPanel>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const themeSync = window.setTimeout(() => {
      const storedTheme = window.localStorage.getItem("pi-theme");
      const shouldUseDark =
        storedTheme === "dark" ||
        (storedTheme === null &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      setDark(shouldUseDark);
      document.documentElement.classList.toggle("dark", shouldUseDark);
    }, 0);

    return () => window.clearTimeout(themeSync);
  }, []);

  function toggleTheme() {
    const nextDark = !dark;
    setDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    window.localStorage.setItem("pi-theme", nextDark ? "dark" : "light");
  }

  function toggleTopPanel(panel: Exclude<TopPanel, null>) {
    setTopPanel((current) => (current === panel ? null : panel));
  }

  return (
    <div
      className={`${styles.shell} flex h-dvh w-screen overflow-hidden bg-canvas`}
      data-file-panel-open={filePanelOpen}
      data-sidebar-open={sidebarOpen}
      data-testid="app-shell"
    >
      <button
        aria-label="Close sidebar"
        className={`${styles.mobileBackdrop} ${
          sidebarOpen ? styles.mobileBackdropOpen : ""
        }`}
        onClick={() => setSidebarOpen(false)}
        type="button"
      />

      <aside
        className={`${styles.sidebar} ${
          sidebarOpen ? styles.sidebarOpen : ""
        }`}
      >
        <SessionSidebar />
      </aside>

      <section
        className={`${styles.workspace} relative flex min-w-0 flex-1 flex-col bg-canvas`}
      >
        <header className="flex h-9 flex-none items-stretch border-b border-line bg-panel pr-12">
          <button
            aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            aria-pressed={sidebarOpen}
            className={`${neutralButton} grid size-9 flex-none place-items-center border-r border-line`}
            onClick={() => setSidebarOpen((open) => !open)}
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            type="button"
          >
            <PanelLeftIcon showExpandIndicator={!sidebarOpen} />
          </button>
          <button
            aria-label={dark ? "Use light theme" : "Use dark theme"}
            aria-pressed={dark}
            className={`${neutralButton} grid size-9 flex-none place-items-center border-r border-line`}
            onClick={toggleTheme}
            title={dark ? "Use light theme" : "Use dark theme"}
            type="button"
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
          {hasActiveSession && (
            <>
              <div className="mx-1 h-[18px] w-px self-center bg-line" />
              <button
                aria-expanded={topPanel === "branches"}
                className={`relative h-9 cursor-pointer border-t-2 px-2.5 text-[11px] ${
                  topPanel === "branches"
                    ? "border-accent bg-selected text-primary"
                    : "border-transparent bg-transparent text-muted hover:bg-hover hover:text-primary"
                }`}
                onClick={() => toggleTopPanel("branches")}
                type="button"
              >
                Branches
              </button>
              <button
                aria-expanded={topPanel === "system"}
                className={`relative h-9 cursor-pointer border-t-2 px-2.5 text-[11px] ${
                  topPanel === "system"
                    ? "border-accent bg-selected text-primary"
                    : "border-transparent bg-transparent text-muted hover:bg-hover hover:text-primary"
                }`}
                onClick={() => toggleTopPanel("system")}
                type="button"
              >
                System
              </button>
            </>
          )}
          <div className="flex-1" />
        </header>

        {topPanel && (
          <section
            className="absolute top-9 left-0 z-500 flex min-h-24 w-full items-center justify-center border-b border-line bg-panel text-xs text-dim shadow-[0_6px_20px_rgba(0,0,0,0.1)]"
            data-testid="top-panel"
          >
            <span>
              {topPanel === "branches"
                ? "No active session"
                : "No system prompt available"}
            </span>
          </section>
        )}

        <ChatWindow />
      </section>

      <aside
        className={`${styles.filePanel} ${
          filePanelOpen ? styles.filePanelOpen : ""
        }`}
      >
        <FilePanel />
      </aside>

      <button
        aria-label={filePanelOpen ? "Hide file panel" : "Show file panel"}
        aria-pressed={filePanelOpen}
        className={`fixed top-0 right-0 z-300 grid size-9 cursor-pointer place-items-center ${
          filePanelOpen
            ? "bg-selected text-accent"
            : "bg-transparent text-muted hover:bg-hover hover:text-primary"
        }`}
        onClick={() => setFilePanelOpen((open) => !open)}
        title={filePanelOpen ? "Hide file panel" : "Show file panel"}
        type="button"
      >
        <PanelRightIcon />
      </button>
    </div>
  );
}
