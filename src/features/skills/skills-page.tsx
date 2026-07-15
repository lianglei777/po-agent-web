"use client";

import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/use-i18n";
import { AddSkillPanel } from "./add-skill-panel";
import { AddSkillPackDialog } from "./add-skill-pack-dialog";
import { ConfirmRemoveDialog } from "./confirm-remove-dialog";
import { ConfirmSkillPackDialog } from "./confirm-skill-pack-dialog";
import { SkillDetail } from "./skill-detail";
import { SkillList } from "./skill-list";
import { SkillPackDetail } from "./skill-pack-detail";
import { SkillPackList, packCopy } from "./skill-pack-list";
import { useSkillPacks } from "./use-skill-packs";
import { useSkills } from "./use-skills";

export function SkillsPage({ cwd }: { cwd: string }) {
  const [adding, setAdding] = useState(false);
  const [addingPack, setAddingPack] = useState(false);
  const [view, setView] = useState<"skills" | "packs">("skills");
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [removeSuccess, setRemoveSuccess] = useState<string | null>(null);
  const [packOperation, setPackOperation] = useState<
    "install" | "remove" | null
  >(null);
  const [packSuccess, setPackSuccess] = useState<string | null>(null);
  const skills = useSkills(cwd);
  const packs = useSkillPacks(cwd);
  const { t } = useI18n();

  function selectView(next: "skills" | "packs") {
    setView(next);
    setAdding(false);
  }

  function handleViewTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    tab: "skills" | "packs",
  ) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = tab === "skills" ? "packs" : "skills";
    selectView(next);
    document.getElementById(`skills-${next}-tab`)?.focus();
  }

  async function handleRemoveConfirm() {
    if (!skills.selectedSkill) return;
    const skillName = skills.selectedSkill.name;
    const ok = await skills.removeSkill();
    if (ok) {
      setRemoveSuccess(`${t.skills.removed} ${skillName}.`);
    }
    setRemoveTarget(null);
  }

  async function handlePackConfirm(scope: "global" | "project") {
    if (!packs.selectedPack || !packOperation) return;
    const ok =
      packOperation === "install"
        ? await packs.install(packs.selectedPack.packId, scope)
        : await packs.remove(packs.selectedPack.packId);
    if (ok) {
      setPackSuccess(
        packOperation === "install"
          ? t.skills.packs.installedSuccess
          : t.skills.packs.removedSuccess,
      );
      void skills.refresh();
    }
    setPackOperation(null);
  }

  async function handlePackLifecycle(operation: "update" | "repair") {
    if (!packs.selectedPack) return;
    setPackSuccess(null);
    const ok = await packs[operation](packs.selectedPack.packId);
    if (ok) {
      setPackSuccess(
        operation === "update"
          ? t.skills.packs.updatedSuccess
          : t.skills.packs.repairedSuccess,
      );
      void skills.refresh();
    }
  }

  async function handleInstallSource(
    source: string,
    scope: "global" | "project",
  ) {
    const ok = await packs.installSource(source, scope);
    if (ok) {
      setPackSuccess(t.skills.packs.installedSuccess);
      void skills.refresh();
    }
    return ok;
  }

  const removing = skills.removingSkillId === skills.selectedSkill?.skillId;
  const packBusy = packs.busy;
  const selectedSkillOwnerPack =
    skills.selectedSkill?.sourceInfo.origin === "package"
      ? packs.packs.find(
          (pack) =>
            pack.scope !== null &&
            pack.source === skills.selectedSkill?.sourceInfo.source,
        )
      : undefined;
  const activeError = view === "skills" ? skills.error : packs.error;

  return (
    <div className="flex min-h-0 flex-1 bg-canvas">
      <aside className="flex min-h-0 w-[210px] shrink-0 flex-col border-r border-line-strong bg-panel">
        <div className="grid grid-cols-2 gap-1 border-b border-line p-2" role="tablist">
          {(["skills", "packs"] as const).map((tab) => (
            <Button
              aria-controls="skills-view-panel"
              aria-selected={view === tab}
              className={
                view === tab ? "bg-selected text-foreground" : undefined
              }
              id={`skills-${tab}-tab`}
              key={tab}
              onClick={() => selectView(tab)}
              onKeyDown={(event) => handleViewTabKeyDown(event, tab)}
              role="tab"
              size="sm"
              tabIndex={view === tab ? 0 : -1}
              type="button"
              variant="ghost"
            >
              {tab === "skills"
                ? t.skills.packs.tabSkills
                : t.skills.packs.tabPacks}
            </Button>
          ))}
        </div>

        <div className="flex gap-1 p-2">
          {view === "skills" ? (
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
          ) : (
            <Button
              className="flex-1 justify-start"
              disabled={packBusy}
              onClick={() => setAddingPack(true)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Plus />
              {t.skills.packs.addAction}
            </Button>
          )}
          <Button
            aria-label={
              view === "skills" ? t.skills.refreshSkills : t.skills.packs.refresh
            }
            disabled={
              view === "skills" ? skills.loading : packs.loading || packBusy
            }
            onClick={() =>
              void (view === "skills" ? skills.refresh() : packs.refresh())
            }
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <RefreshCw
              className={
                (view === "skills" ? skills.loading : packs.loading)
                  ? "animate-spin"
                  : ""
              }
            />
          </Button>
        </div>

        {view === "packs" ? (
          packs.loading && packs.packs.length === 0 ? (
            <Loading label={t.skills.packs.loading} />
          ) : packs.packs.length > 0 ? (
            <SkillPackList
              onSelect={packs.setSelectedPackId}
              packs={packs.packs}
              selectedPackId={packs.selectedPackId}
            />
          ) : (
            <EmptyState title={t.skills.packs.empty} />
          )
        ) : skills.loading && skills.skills.length === 0 ? (
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

        {view === "skills" && skills.diagnostics.length > 0 ? (
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

      <main
        aria-labelledby={`skills-${view}-tab`}
        className="flex min-h-0 min-w-0 flex-1 flex-col"
        id="skills-view-panel"
        role="tabpanel"
      >
        {activeError ? (
          <div
            aria-live="polite"
            className="flex items-center justify-between gap-3 border-b border-destructive/25 bg-destructive/8 px-4 py-2 text-sm text-destructive"
            role="alert"
          >
            <span>{activeError}</span>
            <Button
              onClick={() =>
                void (view === "skills" ? skills.refresh() : packs.refresh())
              }
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
        {packSuccess && view === "packs" && !packBusy ? (
          <div
            aria-live="polite"
            className="flex items-center gap-2 border-b border-success/30 bg-success/8 px-4 py-2 text-sm text-success"
          >
            <CheckCircle2 className="size-4 shrink-0" />
            {packSuccess}
          </div>
        ) : null}
        {view === "packs" ? (
          packs.selectedPack ? (
            <SkillPackDetail
              busy={packBusy}
              onInstall={() => {
                setPackSuccess(null);
                setPackOperation("install");
              }}
              onRemove={() => {
                setPackSuccess(null);
                setPackOperation("remove");
              }}
              onRepair={() => void handlePackLifecycle("repair")}
              onUpdate={() => void handlePackLifecycle("update")}
              pack={packs.selectedPack}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted">
              {t.skills.packs.select}
            </div>
          )
        ) : adding ? (
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
            onViewPack={
              selectedSkillOwnerPack
                ? () => {
                    packs.setSelectedPackId(selectedSkillOwnerPack.packId);
                    selectView("packs");
                  }
                : undefined
            }
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
      <ConfirmSkillPackDialog
        busy={packBusy}
        onClose={() => setPackOperation(null)}
        onConfirm={(scope) => void handlePackConfirm(scope)}
        operation={packOperation}
        packName={
          packs.selectedPack
            ? packCopy(packs.selectedPack).name
            : ""
        }
      />
      <AddSkillPackDialog
        busy={packs.mutation?.operation === "install-source"}
        onClose={() => setAddingPack(false)}
        onInstall={handleInstallSource}
        open={addingPack}
      />
    </div>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="flex flex-1 items-center justify-center text-muted">
      <LoaderCircle className="size-5 animate-spin" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-center">
      <p className="text-sm font-medium">{title}</p>
    </div>
  );
}
