"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, LoaderCircle, RotateCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n/use-i18n";
import { ABSENT_REVISION, type InstructionDocument } from "@/contracts/instructions";
import {
  deleteSystemInstructions,
  getProjectInstructions,
  getSystemInstructions,
  reloadInstructions,
  saveSystemInstructions,
} from "./api";
import { InstructionApiError } from "./types";

export interface SystemPromptDialogProps {
  open: boolean;
  onClose: () => void;
  agentId?: string;
  cwd?: string;
  currentSystemPrompt?: string | null;
  isRunning?: boolean;
  needsApply?: boolean;
  onApplied?: () => void;
  onInstructionsChanged?: () => void;
  onOpenProjectInstructions?: () => void;
  onSystemPromptChange?: (prompt: string) => void;
}

interface EditorState {
  doc: InstructionDocument | null;
  draft: string;
  loading: boolean;
  saving: boolean;
  deleting: boolean;
  error: string;
  conflict: boolean;
}

const initialEditorState: EditorState = {
  doc: null,
  draft: "",
  loading: false,
  saving: false,
  deleting: false,
  error: "",
  conflict: false,
};

function formatBytes(content: string): number {
  return new Blob([content]).size;
}

export function SystemPromptDialog({
  open,
  onClose,
  agentId,
  cwd,
  currentSystemPrompt,
  isRunning,
  needsApply,
  onApplied,
  onInstructionsChanged,
  onOpenProjectInstructions,
  onSystemPromptChange,
}: SystemPromptDialogProps) {
  const { t } = useI18n();
  const [globalState, setGlobalState] = useState<EditorState>(initialEditorState);
  const [projectDoc, setProjectDoc] = useState<InstructionDocument | null>(null);
  const [reloadBusy, setReloadBusy] = useState(false);
  const [reloadError, setReloadError] = useState("");
  const [reloadSuccess, setReloadSuccess] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadGlobal = useCallback(async () => {
    setGlobalState((state) => ({ ...state, loading: true, error: "" }));
    try {
      const result = await getSystemInstructions();
      setGlobalState({
        doc: result.append,
        draft: result.append.content,
        loading: false,
        saving: false,
        deleting: false,
        error: "",
        conflict: false,
      });
    } catch (cause) {
      setGlobalState((state) => ({
        ...state,
        loading: false,
        error: cause instanceof Error ? cause.message : t.instructions.errorLoad,
      }));
    }
  }, [t.instructions.errorLoad]);

  useEffect(() => {
    if (!open) return;
    void loadGlobal();
    setReloadError("");
    setReloadSuccess(false);
    if (cwd) {
      void getProjectInstructions(cwd)
        .then((result) => setProjectDoc(result.project))
        .catch(() => setProjectDoc(null));
    } else {
      setProjectDoc(null);
    }
  }, [cwd, loadGlobal, open]);

  const globalDirty = Boolean(
    globalState.doc && globalState.draft !== globalState.doc.content,
  );

  const saveGlobal = useCallback(
    async (force = false) => {
      setGlobalState((state) => ({
        ...state,
        saving: true,
        error: "",
        conflict: false,
      }));
      try {
        const result = await saveSystemInstructions({
          content: globalState.draft,
          expectedRevision: globalState.doc?.revision ?? ABSENT_REVISION,
          force,
        });
        setGlobalState({
          doc: result.append,
          draft: result.append.content,
          loading: false,
          saving: false,
          deleting: false,
          error: "",
          conflict: false,
        });
        setReloadSuccess(false);
        onInstructionsChanged?.();
      } catch (cause) {
        const error = cause instanceof InstructionApiError ? cause : null;
        setGlobalState((state) => ({
          ...state,
          saving: false,
          error: error?.message ?? t.instructions.errorSave,
          conflict: error?.code === "INSTRUCTION_CONFLICT",
        }));
      }
    },
    [globalState.doc, globalState.draft, onInstructionsChanged, t.instructions.errorSave],
  );

  const deleteGlobal = useCallback(async () => {
    setGlobalState((state) => ({ ...state, deleting: true, error: "" }));
    try {
      await deleteSystemInstructions({
        expectedRevision: globalState.doc?.revision ?? ABSENT_REVISION,
      });
      setGlobalState({
        doc: {
          content: "",
          exists: false,
          filePath: globalState.doc?.filePath ?? "",
          revision: ABSENT_REVISION,
        },
        draft: "",
        loading: false,
        saving: false,
        deleting: false,
        error: "",
        conflict: false,
      });
      setShowDeleteConfirm(false);
      setReloadSuccess(false);
      onInstructionsChanged?.();
    } catch (cause) {
      const error = cause instanceof InstructionApiError ? cause : null;
      setShowDeleteConfirm(false);
      setGlobalState((state) => ({
        ...state,
        deleting: false,
        error: error?.message ?? t.instructions.errorDelete,
        conflict: error?.code === "INSTRUCTION_CONFLICT",
      }));
    }
  }, [globalState.doc, onInstructionsChanged, t.instructions.errorDelete]);

  const handleReload = useCallback(async () => {
    if (!agentId || isRunning) return;
    setReloadBusy(true);
    setReloadError("");
    setReloadSuccess(false);
    try {
      const result = (await reloadInstructions(agentId)) as { systemPrompt?: string };
      if (result.systemPrompt) onSystemPromptChange?.(result.systemPrompt);
      setReloadSuccess(true);
      onApplied?.();
    } catch (cause) {
      setReloadError(
        cause instanceof Error ? cause.message : t.instructions.errorReload,
      );
    } finally {
      setReloadBusy(false);
    }
  }, [agentId, isRunning, onApplied, onSystemPromptChange, t.instructions.errorReload]);

  const handleClose = useCallback(() => {
    if (globalDirty) setShowDiscardConfirm(true);
    else onClose();
  }, [globalDirty, onClose]);

  return (
    <>
      <Dialog onOpenChange={(next) => !next && handleClose()} open={open}>
        <DialogContent closeLabel={t.common.close} className="flex max-h-[85vh] min-h-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="shrink-0 border-b border-line-subtle px-6 py-4">
            <DialogTitle>{t.instructions.title}</DialogTitle>
            <DialogDescription>{t.instructions.description}</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-6">
              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">{t.instructions.finalSystemPrompt}</h3>
                  {currentSystemPrompt ? (
                    <Badge variant="secondary">
                      {t.instructions.bytes.replace("{count}", String(formatBytes(currentSystemPrompt)))}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted">{t.instructions.finalSystemPromptDescription}</p>
                {currentSystemPrompt ? (
                  <ScrollArea className="h-52 rounded-lg border border-line-subtle bg-subtle">
                    <pre className="whitespace-pre-wrap p-3 font-ui-mono text-xs">{currentSystemPrompt}</pre>
                  </ScrollArea>
                ) : (
                  <div className="rounded-lg border border-line-subtle px-3 py-4 text-xs text-muted">
                    {t.instructions.noActiveSystemPrompt}
                  </div>
                )}
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-medium">{t.instructions.sources}</h3>
                <div className="divide-y divide-line-subtle rounded-lg border border-line-subtle">
                  <SourceRow label={t.instructions.builtinSource} status={t.instructions.active} />
                  <SourceRow
                    label={t.instructions.globalAppend}
                    path={globalState.doc?.filePath ?? t.instructions.globalAppendPath.replace(/^.*?[：:]\s*/, "")}
                    status={globalState.doc?.exists ? t.instructions.active : t.instructions.notConfigured}
                  />
                  <SourceRow
                    action={cwd && onOpenProjectInstructions ? (
                      <Button onClick={onOpenProjectInstructions} size="sm" variant="outline">
                        {projectDoc?.exists ? t.instructions.openProjectFile : t.instructions.createProjectFile}
                      </Button>
                    ) : undefined}
                    label={t.instructions.projectInstructions}
                    path={cwd ? projectDoc?.filePath ?? `${cwd}/AGENTS.md` : undefined}
                    status={projectDoc?.exists ? t.instructions.active : t.instructions.notConfigured}
                  />
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-muted" />
                      <h3 className="text-sm font-medium">{t.instructions.globalAppend}</h3>
                      {globalDirty ? <Badge variant="secondary">{t.instructions.dirtyWarning}</Badge> : null}
                    </div>
                    <p className="mt-1 text-xs text-muted">{t.instructions.globalAppendDescription}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button disabled={!globalDirty || globalState.saving || globalState.loading} onClick={() => void saveGlobal()} size="sm">
                      {globalState.saving ? <LoaderCircle className="animate-spin" /> : null}
                      {globalState.saving ? t.instructions.saving : t.instructions.save}
                    </Button>
                    {globalState.doc?.exists ? (
                      <Button disabled={globalState.deleting || globalState.loading} onClick={() => setShowDeleteConfirm(true)} size="sm" variant="outline">
                        <Trash2 />{t.instructions.delete}
                      </Button>
                    ) : null}
                  </div>
                </div>
                {globalState.loading ? (
                  <div className="flex h-36 items-center justify-center text-sm text-muted"><LoaderCircle className="mr-2 animate-spin" />{t.common.loading}</div>
                ) : (
                  <Textarea
                    className="min-h-40 font-ui-mono text-xs"
                    onChange={(event) => setGlobalState((state) => ({ ...state, draft: event.target.value, error: "", conflict: false }))}
                    placeholder={t.instructions.globalContentPlaceholder}
                    value={globalState.draft}
                  />
                )}
                <p className="text-xs text-dim">{t.instructions.bytes.replace("{count}", String(formatBytes(globalState.draft)))}</p>
                {globalState.error ? (
                  <div className="space-y-2 rounded-lg border border-destructive/25 bg-destructive/8 p-3">
                    <p className="text-sm text-destructive">{globalState.error}</p>
                    {globalState.conflict ? (
                      <div className="flex gap-2">
                        <Button onClick={() => void saveGlobal(true)} size="sm" variant="destructive">{t.instructions.conflictOverwrite}</Button>
                        <Button onClick={() => void loadGlobal()} size="sm" variant="outline">{t.instructions.conflictReload}</Button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </section>

              {agentId && (needsApply || reloadSuccess || reloadError) ? (
                <section className="rounded-lg border border-line-subtle p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-medium">{needsApply ? t.instructions.sessionOutdated : t.instructions.sessionCurrent}</h3>
                      <p className="mt-1 text-xs text-muted">{needsApply ? t.instructions.sessionOutdatedDescription : t.instructions.applied}</p>
                    </div>
                    {needsApply ? (
                      <Button disabled={isRunning || reloadBusy} onClick={() => void handleReload()} size="sm" variant="outline">
                        {reloadBusy ? <LoaderCircle className="animate-spin" /> : <RotateCw />}
                        {reloadBusy ? t.instructions.applying : t.instructions.applyToSession}
                      </Button>
                    ) : null}
                  </div>
                  {isRunning && needsApply ? <p className="mt-2 text-xs text-muted">{t.instructions.reloadUnavailableWhileRunning}</p> : null}
                  {reloadError ? <p className="mt-2 text-xs text-destructive">{reloadError}</p> : null}
                </section>
              ) : null}
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t border-line-subtle px-6 py-4">
            <Button onClick={handleClose} variant="outline">{t.common.close}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        description={t.instructions.discardChangesDescription}
        onCancel={() => setShowDiscardConfirm(false)}
        onConfirm={() => { setShowDiscardConfirm(false); onClose(); }}
        open={showDiscardConfirm}
        title={t.instructions.discardChangesTitle}
        confirmLabel={t.instructions.discardChanges}
      />
      <ConfirmDialog
        description={t.instructions.deleteGlobalDescription.replace("{path}", globalState.doc?.filePath ?? t.instructions.globalAppendPath)}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => void deleteGlobal()}
        open={showDeleteConfirm}
        title={t.instructions.deleteGlobalTitle}
        confirmLabel={t.instructions.delete}
      />
    </>
  );
}

function SourceRow({ label, path, status, action }: { label: string; path?: string; status: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-12 items-center gap-3 px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-primary">{label}</div>
        {path ? <div className="truncate font-ui-mono text-caption text-dim" title={path}>{path}</div> : null}
      </div>
      <span className="text-caption text-muted">{status}</span>
      {action}
    </div>
  );
}

function ConfirmDialog({ open, title, description, confirmLabel, onCancel, onConfirm }: { open: boolean; title: string; description: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void }) {
  const { t } = useI18n();
  return (
    <Dialog onOpenChange={(next) => !next && onCancel()} open={open}>
      <DialogContent className="sm:max-w-md" closeLabel={t.common.close}>
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
        <DialogFooter>
          <Button autoFocus onClick={onCancel} variant="outline">{t.common.cancel}</Button>
          <Button onClick={onConfirm} variant="destructive">{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
