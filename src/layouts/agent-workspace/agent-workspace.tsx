"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResizeHandle } from "@/components/ui/resize-handle";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatCenter, type BranchState } from "@/features/chat/chat-center";
import type { OpenFile } from "@/features/files/file-panel";
import {
  ModelProviderPage,
  type ModelProviderSaveStatus,
} from "@/features/model-providers/model-provider-page";
import { SystemPromptDialog } from "@/features/instructions/system-prompt-dialog";
import { ProjectInstructionsEditor } from "@/features/instructions/project-instructions-editor";
import { loadSessions } from "@/features/sessions/api";
import {
  getProjectName,
  getSessionTitle,
} from "@/features/sessions/session-utils";
import type { SessionInfo } from "@/features/sessions/types";
import { useI18n } from "@/i18n/use-i18n";
import {
  DEFAULT_FILE_PANEL_WIDTH,
  DEFAULT_SIDEBAR_WIDTH,
  fitPanelWidths,
  getFilePanelWidthBounds,
  getSidebarWidthBounds,
  type PanelWidths,
} from "./panel-sizing";
import {
  ProjectPanel,
  type ProjectPanelTab,
} from "./project-panel";
import {
  shouldConfirmWorkspaceNavigation,
  type WorkspaceView,
} from "./workspace-navigation";
import { WorkspaceSidebar } from "./workspace-sidebar";
import { WorkspaceTopBar } from "./workspace-top-bar";

type DraftSession = {
  id: string;
  cwd: string;
  created: string;
};

export function AgentWorkspace() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [projectPanelOpen, setProjectPanelOpen] = useState(false);
  const [projectPanelTab, setProjectPanelTab] =
    useState<ProjectPanelTab>("files");
  const [activeView, setActiveView] = useState<WorkspaceView>("chat");
  const [modelProviderDirty, setModelProviderDirty] = useState(false);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionInfo | null>(null);
  const [activeCwd, setActiveCwd] = useState<string | null>(null);
  const [newSessionCwd, setNewSessionCwd] = useState<string | null>(null);
  const [draftSession, setDraftSession] = useState<DraftSession | null>(null);
  const [chatInstanceKey, setChatInstanceKey] = useState(0);
  const [branchState, setBranchState] = useState<BranchState | null>(null);
  const [modelsRevision, setModelsRevision] = useState(0);
  const [modelProviderSaveStatus, setModelProviderSaveStatus] =
    useState<ModelProviderSaveStatus>({ phase: "idle" });
  const [openFile, setOpenFile] = useState<OpenFile | null>(null);
  const [systemPromptOpen, setSystemPromptOpen] = useState(false);
  const [currentSystemPrompt, setCurrentSystemPrompt] = useState<string | null>(null);
  const [instructionsNeedApply, setInstructionsNeedApply] = useState(false);
  const [projectInstructionsOpen, setProjectInstructionsOpen] = useState(false);
  const [projectInstructionsDirty, setProjectInstructionsDirty] = useState(false);
  const [initialSessionId, setInitialSessionId] = useState<
    string | null | undefined
  >(undefined);
  const [sessionRefreshKey, setSessionRefreshKey] = useState(0);
  const [explorerRefreshKey, setExplorerRefreshKey] = useState(0);
  const [panelWidths, setPanelWidths] = useState<PanelWidths>({
    filePanel: DEFAULT_FILE_PANEL_WIDTH,
    sidebar: DEFAULT_SIDEBAR_WIDTH,
  });
  const [resizingPanel, setResizingPanel] = useState<
    "filePanel" | "sidebar" | null
  >(null);
  const [workspaceWidth, setWorkspaceWidth] = useState(1280);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const { t } = useI18n();
  const showProjectPanel =
    activeView === "chat" && projectPanelOpen && Boolean(activeCwd);
  const sidebarBounds = getSidebarWidthBounds(
    workspaceWidth,
    panelWidths.filePanel,
    showProjectPanel,
  );
  const filePanelBounds = getFilePanelWidthBounds(
    workspaceWidth,
    panelWidths.sidebar,
    sidebarOpen,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setInitialSessionId(
        new URLSearchParams(window.location.search).get("session"),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;

    const fitToWorkspace = () => {
      setWorkspaceWidth(workspace.clientWidth);
      setPanelWidths((current) =>
        fitPanelWidths(workspace.clientWidth, current, {
          filePanelOpen: showProjectPanel,
          sidebarOpen,
        }),
      );
    };
    const observer = new ResizeObserver(fitToWorkspace);
    observer.observe(workspace);

    return () => observer.disconnect();
  }, [showProjectPanel, sidebarOpen]);

  const requestNavigation = useCallback(
    (targetView: WorkspaceView, action: () => void) => {
      if (projectInstructionsOpen && projectInstructionsDirty) {
        pendingNavigationRef.current = action;
        setConfirmingDiscard(true);
        return;
      }
      if (
        shouldConfirmWorkspaceNavigation(
          activeView,
          targetView,
          modelProviderDirty,
        )
      ) {
        pendingNavigationRef.current = action;
        setConfirmingDiscard(true);
        return;
      }
      action();
    },
    [activeView, modelProviderDirty, projectInstructionsDirty, projectInstructionsOpen],
  );

  const handleOpenModelProvider = useCallback(
    () =>
      requestNavigation("model-provider", () =>
        setActiveView("model-provider"),
      ),
    [requestNavigation],
  );
  const handleOpenSkills = useCallback(
    () =>
      requestNavigation("chat", () => {
        setActiveView("chat");
        setProjectPanelTab("skills");
        setProjectPanelOpen(true);
      }),
    [requestNavigation],
  );

  function cancelDiscard() {
    pendingNavigationRef.current = null;
    setConfirmingDiscard(false);
  }

  function confirmDiscard() {
    const action = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    setModelProviderDirty(false);
    setProjectInstructionsDirty(false);
    setProjectInstructionsOpen(false);
    setConfirmingDiscard(false);
    action?.();
  }

  const updateSessionUrl = useCallback((sessionId: string | null) => {
    const url = new URL(window.location.href);
    if (sessionId) url.searchParams.set("session", sessionId);
    else url.searchParams.delete("session");
    window.history.replaceState(null, "", url);
  }, []);

  const resetChat = useCallback(() => {
    setChatInstanceKey((current) => current + 1);
    setCurrentSystemPrompt(null);
    setInstructionsNeedApply(false);
  }, []);

  const handleCwdChange = useCallback(
    (cwd: string) => {
      setActiveCwd(cwd);
      setOpenFile(null);
      if (selectedSession?.cwd !== cwd) setSelectedSession(null);
      setNewSessionCwd(cwd);
      setDraftSession(null);
      setActiveView("chat");
      updateSessionUrl(null);
      resetChat();
    },
    [resetChat, selectedSession, updateSessionUrl],
  );

  const handleSelectSession = useCallback(
    (session: SessionInfo, isRestore = false) => {
      setActiveCwd(session.cwd);
      setSelectedSession(session);
      setNewSessionCwd(null);
      setDraftSession(null);
      setActiveView("chat");
      if (!isRestore) updateSessionUrl(session.id);
      setChatInstanceKey((current) => current + 1);
    },
    [updateSessionUrl],
  );

  const handleNewSession = useCallback(
    (temporaryId: string, cwd: string) => {
      resetChat();
      setSelectedSession(null);
      setNewSessionCwd(cwd);
      setDraftSession({
        id: temporaryId,
        cwd,
        created: new Date().toISOString(),
      });
      setActiveView("chat");
      updateSessionUrl(null);
    },
    [resetChat, updateSessionUrl],
  );

  const handleSessionDeleted = useCallback(
    (session: SessionInfo) => {
      if (selectedSession?.id !== session.id) return;
      setSelectedSession(null);
      setNewSessionCwd(session.cwd);
      setDraftSession({
        id: crypto.randomUUID(),
        cwd: session.cwd,
        created: new Date().toISOString(),
      });
      updateSessionUrl(null);
      resetChat();
    },
    [resetChat, selectedSession, updateSessionUrl],
  );

  const selectSessionById = useCallback(
    async (sessionId: string) => {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const sessions = await loadSessions();
        const next = sessions.find((item) => item.id === sessionId);
        if (next) {
          handleSelectSession(next);
          setSessionRefreshKey((current) => current + 1);
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 150));
      }
    },
    [handleSelectSession],
  );

  const handleAgentEnd = useCallback(() => {
    setSessionRefreshKey((current) => current + 1);
    setExplorerRefreshKey((current) => current + 1);
  }, []);

  const handleSessionCreated = useCallback(
    (sessionId: string) => {
      setNewSessionCwd(null);
      setDraftSession(null);
      void selectSessionById(sessionId);
    },
    [selectSessionById],
  );

  const handleSessionForked = useCallback(
    (sessionId: string) => void selectSessionById(sessionId),
    [selectSessionById],
  );

  const handleOpenFile = useCallback((path: string, name: string) => {
    requestNavigation("chat", () => {
      if (isRootAgentsFile(activeCwd, path, name)) {
        setOpenFile(null);
        setProjectInstructionsOpen(true);
      } else {
        setProjectInstructionsOpen(false);
        setOpenFile({ path, name });
      }
      setProjectPanelTab("files");
      setProjectPanelOpen(true);
    });
  }, [activeCwd, requestNavigation]);

  const handleOpenProjectInstructions = useCallback(() => {
    requestNavigation("chat", () => {
      setOpenFile(null);
      setProjectInstructionsOpen(true);
      setProjectPanelTab("files");
      setProjectPanelOpen(true);
      setSystemPromptOpen(false);
    });
  }, [requestNavigation]);

  const handleInstructionsChanged = useCallback(() => {
    setExplorerRefreshKey((current) => current + 1);
    if (selectedSession) setInstructionsNeedApply(true);
  }, [selectedSession]);

  const handleToggleProjectPanel = useCallback(() => {
    if (!projectPanelOpen) {
      setProjectPanelOpen(true);
      return;
    }
    requestNavigation("chat", () => {
      setProjectPanelOpen(false);
      setProjectInstructionsOpen(false);
    });
  }, [projectPanelOpen, requestNavigation]);

  const handleProjectPanelTabChange = useCallback(
    (tab: ProjectPanelTab) => {
      if (tab === projectPanelTab) return;
      requestNavigation("chat", () => {
        setProjectPanelTab(tab);
      });
    },
    [projectPanelTab, requestNavigation],
  );

  const handleAtMention = useCallback((path: string) => {
    window.dispatchEvent(
      new CustomEvent("pi:mention-file", { detail: path }),
    );
  }, []);

  return (
    <TooltipProvider>
      <div
        className="flex h-dvh min-w-[1024px] overflow-hidden bg-canvas"
        data-project-panel-open={showProjectPanel}
        data-sidebar-open={sidebarOpen}
        data-testid="agent-workspace"
        ref={workspaceRef}
      >
        <aside
          className={`relative flex-none overflow-hidden bg-panel transition-[width,border-width] ${
            resizingPanel === "sidebar"
              ? "duration-0"
              : "duration-[var(--motion-standard)]"
          } ${sidebarOpen ? "w-[var(--panel-width)]" : "w-0"}`}
          style={
            sidebarOpen
              ? ({ "--panel-width": `${panelWidths.sidebar}px` } as CSSProperties)
              : undefined
          }
        >
          <div className="flex h-full w-[var(--panel-width)] flex-col">
            <WorkspaceSidebar
              activeView={activeView}
              onNewChat={() => {
                if (!activeCwd) return;
                requestNavigation("chat", () =>
                  handleNewSession(crypto.randomUUID(), activeCwd),
                );
              }}
              onOpenModelProvider={handleOpenModelProvider}
              onOpenSystemPrompt={() => setSystemPromptOpen(true)}
              sessionProps={{
                draftSession,
                initialSessionId,
                onCwdChange: (cwd) =>
                  requestNavigation("chat", () => handleCwdChange(cwd)),
                onInitialRestoreDone: () => updateSessionUrl(null),
                onNewSession: (temporaryId, cwd) =>
                  requestNavigation("chat", () =>
                    handleNewSession(temporaryId, cwd),
                  ),
                onSelectSession: (session, isRestore) =>
                  requestNavigation("chat", () =>
                    handleSelectSession(session, isRestore),
                  ),
                onSessionDeleted: handleSessionDeleted,
                refreshKey: sessionRefreshKey,
                selectedCwd: activeCwd,
                selectedSessionId:
                  selectedSession?.id ?? draftSession?.id ?? null,
              }}
            />
          </div>
        </aside>
        {sidebarOpen ? (
          <ResizeHandle
            ariaLabel={t.workspace.resizeSessionSidebar}
            direction={1}
            max={sidebarBounds.max}
            min={sidebarBounds.min}
            onResize={(sidebar) =>
              setPanelWidths((current) => ({ ...current, sidebar }))
            }
            onResizeEnd={() => setResizingPanel(null)}
            onResizeStart={() => setResizingPanel("sidebar")}
            value={panelWidths.sidebar}
          />
        ) : null}

        <section className="relative flex min-w-0 flex-1 flex-col bg-canvas">
          <WorkspaceTopBar
            activeView={activeView}
            branchActiveLeafId={branchState?.activeLeafId}
            branchRunning={branchState?.running}
            branchTree={branchState?.tree}
            projectPanelOpen={projectPanelOpen}
            modelProviderSaveStatus={modelProviderSaveStatus}
            onBranchChangeLeaf={
              branchState
                ? (leafId) => void branchState.changeLeaf(leafId)
                : undefined
            }
            onToggleProjectPanel={handleToggleProjectPanel}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            projectName={activeCwd ? getProjectName(activeCwd) : null}
            sessionTitle={
              selectedSession ? getSessionTitle(selectedSession) : null
            }
            showBranchHistory={activeView === "chat"}
            sidebarOpen={sidebarOpen}
          />

          <div
            className={
              activeView === "chat" ? "flex min-h-0 flex-1" : "hidden"
            }
          >
            <ChatCenter
              key={chatInstanceKey}
              modelsRevision={modelsRevision}
              newSessionCwd={newSessionCwd}
              onAgentEnd={handleAgentEnd}
              onBranchState={setBranchState}
              onOpenModelProvider={handleOpenModelProvider}
              onOpenSkills={handleOpenSkills}
              onSessionCreated={handleSessionCreated}
              onSessionForked={handleSessionForked}
              onSystemPromptChange={setCurrentSystemPrompt}
              projectName={activeCwd ? getProjectName(activeCwd) : null}
              session={selectedSession}
            />
          </div>

          {activeView === "model-provider" ? (
            <ModelProviderPage
              onDirtyChange={setModelProviderDirty}
              onSaved={() => setModelsRevision((current) => current + 1)}
              onSaveStatusChange={setModelProviderSaveStatus}
            />
          ) : null}
        </section>

        {showProjectPanel && activeCwd ? (
          <>
            <ResizeHandle
              ariaLabel={t.workspace.resizeProjectPanel}
              direction={-1}
              max={filePanelBounds.max}
              min={filePanelBounds.min}
              onResize={(filePanel) =>
                setPanelWidths((current) => ({ ...current, filePanel }))
              }
              onResizeEnd={() => setResizingPanel(null)}
              onResizeStart={() => setResizingPanel("filePanel")}
              value={panelWidths.filePanel}
            />
            <aside
              className={`flex-none overflow-hidden bg-canvas ${
                resizingPanel === "filePanel"
                  ? "duration-0"
                  : "duration-[var(--motion-standard)]"
              } w-[var(--panel-width)]`}
              style={
                {
                  "--panel-width": `${panelWidths.filePanel}px`,
                } as CSSProperties
              }
            >
              <ProjectPanel
                activeTab={projectPanelTab}
                cwd={activeCwd}
                file={openFile}
                onAtMention={handleAtMention}
                onClose={handleToggleProjectPanel}
                onOpenFile={handleOpenFile}
                onTabChange={handleProjectPanelTabChange}
                projectName={getProjectName(activeCwd)}
                refreshKey={explorerRefreshKey}
                specialContent={
                  activeCwd && projectInstructionsOpen ? (
                    <ProjectInstructionsEditor
                      agentId={selectedSession?.id}
                      cwd={activeCwd}
                      isRunning={branchState?.busy}
                      needsApply={instructionsNeedApply}
                      onChanged={handleInstructionsChanged}
                      onApplied={() => setInstructionsNeedApply(false)}
                      onDirtyChange={setProjectInstructionsDirty}
                      onSystemPromptChange={setCurrentSystemPrompt}
                    />
                  ) : undefined
                }
                specialTitle={projectInstructionsOpen ? "AGENTS.md" : undefined}
              />
            </aside>
          </>
        ) : null}

        <Dialog
          onOpenChange={(open) => {
            if (!open) cancelDiscard();
          }}
          open={confirmingDiscard}
        >
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>
                {projectInstructionsDirty
                  ? t.instructions.discardChangesTitle
                  : t.models.discardChangesTitle}
              </DialogTitle>
              <DialogDescription>
                {projectInstructionsDirty
                  ? t.instructions.discardChangesDescription
                  : t.models.discardChangesDescription}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button autoFocus onClick={cancelDiscard} variant="outline">
              {projectInstructionsDirty
                ? t.instructions.continueEditing
                : t.models.continueEditing}
              </Button>
              <Button onClick={confirmDiscard} variant="destructive">
                {projectInstructionsDirty
                  ? t.instructions.discardChanges
                  : t.models.discardChanges}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <SystemPromptDialog
          agentId={selectedSession?.id}
          currentSystemPrompt={currentSystemPrompt}
          cwd={activeCwd ?? undefined}
          isRunning={branchState?.busy}
          needsApply={instructionsNeedApply}
          onApplied={() => setInstructionsNeedApply(false)}
          onClose={() => setSystemPromptOpen(false)}
          onInstructionsChanged={handleInstructionsChanged}
          onOpenProjectInstructions={handleOpenProjectInstructions}
          onSystemPromptChange={setCurrentSystemPrompt}
          open={systemPromptOpen}
        />
      </div>
    </TooltipProvider>
  );
}

function isRootAgentsFile(cwd: string | null, filePath: string, name: string) {
  if (!cwd || name.toLowerCase() !== "agents.md") return false;
  const normalize = (value: string) => value.replaceAll("\\", "/").replace(/\/$/, "").toLowerCase();
  return normalize(filePath) === `${normalize(cwd)}/agents.md`;
}
