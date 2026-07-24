"use client";

import { FileText, PanelRightClose, Sparkles } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FilePanel, type OpenFile } from "@/features/files/file-panel";
import { SkillsPage } from "@/features/skills/skills-page";
import { useI18n } from "@/i18n/use-i18n";

export type ProjectPanelTab = "files" | "skills";

export function ProjectPanel({
  activeTab,
  cwd,
  file,
  onAtMention,
  onClose,
  onOpenFile,
  onTabChange,
  projectName,
  refreshKey = 0,
  specialContent,
  specialTitle,
}: {
  activeTab: ProjectPanelTab;
  cwd: string;
  file: OpenFile | null;
  onAtMention?: (path: string) => void;
  onClose: () => void;
  onOpenFile?: (path: string, name: string) => void;
  onTabChange: (tab: ProjectPanelTab) => void;
  projectName: string;
  refreshKey?: number;
  specialContent?: ReactNode;
  specialTitle?: string;
}) {
  const { t } = useI18n();

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    tab: ProjectPanelTab,
  ) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = tab === "files" ? "skills" : "files";
    onTabChange(next);
    document.getElementById(`project-panel-${next}-tab`)?.focus();
  }

  return (
    <div className="flex h-full min-w-0 flex-col bg-canvas">
      <div className="flex h-11 flex-none items-stretch border-b border-line-subtle">
        <div
          aria-label={t.workspace.projectPanel}
          className="flex min-w-0 flex-1 items-center gap-1 p-1.5"
          role="tablist"
        >
          {(["files", "skills"] as const).map((tab) => (
            <Button
              aria-controls="project-panel-content"
              aria-selected={activeTab === tab}
              className="h-8 min-w-0 flex-1"
              id={`project-panel-${tab}-tab`}
              key={tab}
              onClick={() => onTabChange(tab)}
              onKeyDown={(event) => handleTabKeyDown(event, tab)}
              role="tab"
              size="sm"
              tabIndex={activeTab === tab ? 0 : -1}
              type="button"
              variant={activeTab === tab ? "secondary" : "ghost"}
            >
              {tab === "files" ? <FileText /> : <Sparkles />}
              <span className="truncate">
                {tab === "files" ? t.files.files : t.workspace.skills}
              </span>
            </Button>
          ))}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={t.workspace.hideProjectPanel}
              className="h-full rounded-none border-l border-line-subtle"
              onClick={onClose}
              size="icon"
              type="button"
              variant="ghost"
            >
              <PanelRightClose />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {t.workspace.hideProjectPanel}
          </TooltipContent>
        </Tooltip>
      </div>

      <div
        aria-labelledby={`project-panel-${activeTab}-tab`}
        className="flex min-h-0 flex-1"
        id="project-panel-content"
        role="tabpanel"
      >
        {activeTab === "files" ? (
          <FilePanel
            cwd={cwd}
            file={file}
            onAtMention={onAtMention}
            onOpenFile={onOpenFile}
            refreshKey={refreshKey}
            specialContent={specialContent}
            specialTitle={specialTitle}
          />
        ) : (
          <SkillsPage cwd={cwd} key={cwd} projectName={projectName} />
        )}
      </div>
    </div>
  );
}
