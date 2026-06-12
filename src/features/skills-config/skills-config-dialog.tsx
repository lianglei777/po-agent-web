"use client";

import {
  AlertTriangle,
  LoaderCircle,
  Plus,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddSkillPanel } from "./add-skill-panel";
import { SkillDetail } from "./skill-detail";
import { SkillList } from "./skill-list";
import { useSkillsConfig } from "./use-skills-config";

export function SkillsConfigDialog({
  cwd,
  onClose,
}: {
  cwd: string;
  onClose: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const skills = useSkillsConfig(cwd);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-describedby="skills-config-description"
        className="h-[78vh] w-[min(860px,calc(100vw-32px))] max-w-none grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-[10px] border-line bg-canvas p-0 shadow-2xl sm:max-w-none"
        showCloseButton={false}
      >
        <header className="flex min-h-[49px] shrink-0 items-center gap-3 border-b border-line bg-panel px-[18px] py-3">
          <Sparkles className="size-4" />
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base">Skills</DialogTitle>
            <DialogDescription
              className="truncate text-xs"
              id="skills-config-description"
            >
              {cwd}
            </DialogDescription>
          </div>
          <Button
            aria-label="Refresh skills"
            disabled={skills.loading}
            onClick={() => void skills.refresh()}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <RefreshCw className={skills.loading ? "animate-spin" : ""} />
          </Button>
          <Button
            aria-label="Close skills"
            onClick={onClose}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <X />
          </Button>
        </header>

        <div className="flex min-h-0">
          <aside className="flex min-h-0 w-[210px] shrink-0 flex-col border-r border-line bg-panel">
            <div className="p-2">
              <Button
                aria-pressed={adding}
                className="w-full justify-start"
                onClick={() => setAdding((current) => !current)}
                size="sm"
                type="button"
                variant={adding ? "secondary" : "ghost"}
              >
                <Plus />
                Add skill
              </Button>
            </div>

            {skills.loading && skills.skills.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-muted">
                <LoaderCircle className="size-5 animate-spin" />
                <span className="sr-only">Loading skills</span>
              </div>
            ) : skills.skills.length > 0 ? (
              <SkillList
                onSelect={(skillId) => {
                  setAdding(false);
                  skills.setSelectedSkillId(skillId);
                }}
                selectedSkillId={skills.selectedSkillId}
                skills={skills.skills}
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                <Sparkles className="size-6 text-dim" />
                <p className="mt-3 text-sm font-medium">No skills found</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Add one from the market or configure a resource path.
                </p>
              </div>
            )}

            {skills.diagnostics.length > 0 ? (
              <details className="border-t border-line p-3 text-xs">
                <summary className="flex cursor-pointer items-center gap-2 text-muted">
                  <AlertTriangle className="size-3.5" />
                  {skills.diagnostics.length} diagnostic
                  {skills.diagnostics.length === 1 ? "" : "s"}
                </summary>
                <ul className="mt-2 space-y-2 text-muted">
                  {skills.diagnostics.map((diagnostic, index) => (
                    <li key={`${diagnostic.message}-${index}`}>
                      {diagnostic.message}
                      {diagnostic.path ? (
                        <span className="mt-0.5 block break-all font-ui-mono text-[11px] text-dim">
                          {diagnostic.path}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </aside>

          <main className="flex min-h-0 min-w-0 flex-1 flex-col">
            {skills.error ? (
              <div
                aria-live="polite"
                className="flex items-center justify-between gap-3 border-b border-destructive/25 bg-destructive/8 px-4 py-2 text-sm text-destructive"
                role="alert"
              >
                <span>{skills.error}</span>
                <Button
                  onClick={() => void skills.refresh()}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Retry
                </Button>
              </div>
            ) : null}
            {adding ? (
              <AddSkillPanel
                cwd={cwd}
                onInstalled={() => void skills.refresh()}
              />
            ) : skills.selectedSkill ? (
              <SkillDetail
                onToggle={() => void skills.toggleModelInvocation()}
                saving={
                  skills.savingSkillId === skills.selectedSkill.skillId
                }
                skill={skills.selectedSkill}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted">
                Select a skill to view its details.
              </div>
            )}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
