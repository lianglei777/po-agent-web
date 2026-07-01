"use client";

import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/use-i18n";
import { AddSkillPanel } from "./add-skill-panel";
import { ConfirmRemoveDialog } from "./confirm-remove-dialog";
import { SkillDetail } from "./skill-detail";
import { SkillList } from "./skill-list";
import { useSkills } from "./use-skills";

export function SkillsPage({ cwd }: { cwd: string }) {
  const [adding, setAdding] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [removeSuccess, setRemoveSuccess] = useState<string | null>(null);
  const skills = useSkills(cwd);
  const { t } = useI18n();

  async function handleRemoveConfirm() {
    if (!skills.selectedSkill) return;
    const skillName = skills.selectedSkill.name;
    const ok = await skills.removeSkill();
    if (ok) {
      setRemoveSuccess(`${t.skills.removed} ${skillName}.`);
    }
    setRemoveTarget(null);
  }

  const removing = skills.removingSkillId === skills.selectedSkill?.skillId;

  return (
    <div className="flex min-h-0 flex-1 bg-canvas">
      <aside className="flex min-h-0 w-[210px] shrink-0 flex-col border-r border-line-strong bg-panel">
        <div className="flex gap-1 p-2">
          <Button
            aria-pressed={adding}
            className="flex-1 justify-start"
            onClick={() => setAdding((current) => !current)}
            size="sm"
            type="button"
            variant={adding ? "secondary" : "ghost"}
          >
            <Plus />
            {t.skills.addSkill}
          </Button>
          <Button
            aria-label={t.skills.refreshSkills}
            disabled={skills.loading}
            onClick={() => void skills.refresh()}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <RefreshCw className={skills.loading ? "animate-spin" : ""} />
          </Button>
        </div>

        {skills.loading && skills.skills.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-muted">
            <LoaderCircle className="size-5 animate-spin" />
            <span className="sr-only">{t.skills.loadingSkills}</span>
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
            <p className="text-sm font-medium">{t.skills.noSkillsFound}</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              {t.skills.noSkillsFoundDescription}
            </p>
          </div>
        )}

        {skills.diagnostics.length > 0 ? (
          <details className="border-t border-line p-3 text-xs">
            <summary className="flex cursor-pointer items-center gap-2 text-muted">
              <AlertTriangle className="size-3.5" />
              {skills.diagnostics.length}{" "}
              {skills.diagnostics.length === 1
                ? t.skills.diagnostic
                : t.skills.diagnostics}
            </summary>
            <ul className="mt-2 space-y-2 text-muted">
              {skills.diagnostics.map((diagnostic, index) => (
                <li key={`${diagnostic.message}-${index}`}>
                  <span
                    className={`mr-1.5 font-medium ${
                      diagnostic.severity === "warning"
                        ? "text-warning"
                        : diagnostic.severity === "error"
                          ? "text-destructive"
                          : "text-primary"
                    }`}
                  >
                    {t.skills.diagnosticSeverity[diagnostic.severity]}
                  </span>
                  <span>{diagnostic.message}</span>
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
              {t.common.retry}
            </Button>
          </div>
        ) : null}
        {removeSuccess && !removing ? (
          <div
            aria-live="polite"
            className="flex items-center gap-2 border-b border-success/30 bg-success/8 px-4 py-2 text-sm text-success"
          >
            <CheckCircle2 className="size-4 shrink-0" />
            {removeSuccess}
          </div>
        ) : null}
        {adding ? (
          <AddSkillPanel
            cwd={cwd}
            onInstalled={(result) => {
              const installedSkillId = result.skills[0]?.skillId;
              if (installedSkillId) {
                skills.setSelectedSkillId(installedSkillId);
              }
              setAdding(false);
              void skills.refresh();
            }}
          />
        ) : skills.selectedSkill ? (
          <SkillDetail
            onRemove={() => {
              setRemoveSuccess(null);
              setRemoveTarget(skills.selectedSkill!.skillId);
            }}
            onToggle={() => void skills.toggleModelInvocation()}
            removing={removing}
            saving={skills.savingSkillId === skills.selectedSkill.skillId}
            skill={skills.selectedSkill}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted">
            {t.skills.selectSkill}
          </div>
        )}
      </main>

      <ConfirmRemoveDialog
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => void handleRemoveConfirm()}
        open={removeTarget !== null}
        removing={removing}
        skillName={skills.selectedSkill?.name ?? ""}
      />
    </div>
  );
}
