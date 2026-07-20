import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useI18n } from "@/i18n/use-i18n";
import type { SessionTreeNode } from "@/features/chat/agent-types";
import { BranchHistory } from "@/features/chat/branch-history";
import type { ModelProviderSaveStatus } from "@/features/model-providers/model-provider-page";
import type { WorkspaceView } from "./workspace-navigation";

type WorkspaceTopBarProps = {
  activeView: WorkspaceView;
  filePanelOpen: boolean;
  modelProviderSaveStatus?: ModelProviderSaveStatus;
  onToggleFilePanel: () => void;
  onToggleSidebar: () => void;
  projectName: string | null;
  sessionTitle: string | null;
  sidebarOpen: boolean;
  showBranchHistory?: boolean;
  branchTree?: SessionTreeNode[];
  branchActiveLeafId?: string | null;
  branchRunning?: boolean;
  onBranchChangeLeaf?: (leafId: string) => void;
};

export function WorkspaceTopBar({
  activeView,
  filePanelOpen,
  modelProviderSaveStatus,
  onToggleFilePanel,
  onToggleSidebar,
  projectName,
  sessionTitle,
  sidebarOpen,
  showBranchHistory,
  branchTree,
  branchActiveLeafId,
  branchRunning,
  onBranchChangeLeaf,
}: WorkspaceTopBarProps) {
  const { t } = useI18n();
  const title =
    activeView === "model-provider"
      ? t.workspace.modelProvider
      : activeView === "skills"
        ? t.workspace.skills
        : sessionTitle ?? t.workspace.newChat;

  return (
    <header className="flex h-10 flex-none items-center border-b border-line-subtle bg-canvas">
      <TopBarIconButton
        label={sidebarOpen ? t.workspace.hideSidebar : t.workspace.showSidebar}
        onClick={onToggleSidebar}
      >
        {sidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
      </TopBarIconButton>

      <div className="min-w-0 flex-1 px-3">
        <div className="truncate text-xs font-medium text-primary">{title}</div>
      </div>

      {activeView === "model-provider" ? (
        <ModelProviderSaveIndicator status={modelProviderSaveStatus} />
      ) : null}

      {/* 分支历史按钮 */}
      {showBranchHistory &&
      branchTree &&
      onBranchChangeLeaf ? (
        <div className="mr-1">
          <BranchHistory
            activeLeafId={branchActiveLeafId ?? null}
            compact
            onChangeLeaf={onBranchChangeLeaf}
            running={branchRunning ?? false}
            tree={branchTree}
          />
        </div>
      ) : null}

      {activeView === "chat" && projectName && !filePanelOpen ? (
        <TopBarIconButton
          borderSide="left"
          label={t.workspace.showFilePanel}
          onClick={onToggleFilePanel}
        >
          <PanelRightOpen />
        </TopBarIconButton>
      ) : null}
    </header>
  );
}

function ModelProviderSaveIndicator({
  status,
}: {
  status?: ModelProviderSaveStatus;
}) {
  const { t } = useI18n();
  if (!status || status.phase === "idle") return null;

  if (status.phase === "error") {
    return (
      <div
        className="mr-3 flex min-w-0 max-w-[420px] items-center gap-2 text-xs"
        role="alert"
      >
        <span
          className="min-w-0 truncate text-destructive"
          title={status.message}
        >
          {status.message}
        </span>
        {status.onRetry ? (
          <Button
            className="h-7 shrink-0 px-2"
            onClick={status.onRetry}
            size="sm"
            type="button"
            variant="outline"
          >
            {t.models.retrySave}
          </Button>
        ) : null}
      </div>
    );
  }

  const label =
    status.phase === "saving"
      ? t.models.autoSaving
      : status.phase === "pending"
        ? t.models.autoSavePending
        : t.models.autoSaved;

  return (
    <div
      className={`mr-3 min-w-24 text-right text-xs ${
        status.phase === "saved"
          ? "text-accent-deep"
          : status.phase === "pending"
            ? "text-dim"
            : "text-muted"
      }`}
      role="status"
    >
      {label}
    </div>
  );
}

function TopBarIconButton({
  borderSide = "right",
  children,
  label,
  onClick,
}: {
  borderSide?: "left" | "right";
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          className={`h-full rounded-none ${
            borderSide === "left"
              ? "border-l border-line-subtle"
              : "border-r border-line-subtle"
          } text-muted`}
          onClick={onClick}
          size="icon"
          type="button"
          variant="ghost"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
