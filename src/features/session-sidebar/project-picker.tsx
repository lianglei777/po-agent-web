"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Folder, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useI18n } from "@/i18n/use-i18n";
import { addProject, browseProjects } from "./api";
import type { ProjectBrowseResult } from "./types";

export function ProjectPicker({
  onSelect,
  trigger = "icon",
}: {
  onSelect: (cwd: string) => void;
  trigger?: "icon" | "button";
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"input" | "browse">("input");
  const [pathInput, setPathInput] = useState("");
  const [result, setResult] = useState<ProjectBrowseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { t } = useI18n();

  const navigate = useCallback(
    async (target?: string) => {
      setLoading(true);
      try {
        setResult(await browseProjects(target));
        setError("");
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : t.sessions.unableToLoadDirectory,
        );
      } finally {
        setLoading(false);
      }
    },
    [t.sessions.unableToLoadDirectory],
  );

  function closePicker() {
    setOpen(false);
    setMode("input");
    setPathInput("");
    setError("");
  }

  async function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const path = pathInput.trim();
    if (!path || saving) return;
    setSaving(true);
    try {
      const project = await addProject(path);
      onSelect(project.path);
      closePicker();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : t.sessions.unableToLoadDirectory,
      );
    } finally {
      setSaving(false);
    }
  }

  function selectCurrent() {
    if (!result) return;
    setPathInput(result.current);
    setMode("input");
    setError("");
  }

  const triggerButton = (
    <Button
      aria-label={t.workspace.openProject}
      onClick={() => setOpen(true)}
      size={trigger === "icon" ? "icon-sm" : "sm"}
      type="button"
      variant={trigger === "icon" ? "ghost" : "outline"}
    >
      <Plus />
      {trigger === "button" ? t.sessions.openProject : null}
    </Button>
  );

  return (
    <>
      {trigger === "icon" ? (
        <Tooltip>
          <TooltipTrigger asChild>{triggerButton}</TooltipTrigger>
          <TooltipContent>{t.workspace.openProject}</TooltipContent>
        </Tooltip>
      ) : (
        triggerButton
      )}

      <Dialog
        onOpenChange={(nextOpen) => {
          if (nextOpen) setOpen(true);
          else closePicker();
        }}
        open={open}
      >
        <DialogContent className="max-w-xl" closeLabel={t.common.close}>
          {mode === "input" ? (
            <form
              className="space-y-4"
              onSubmit={(event) => void submitProject(event)}
            >
              <DialogHeader>
                <DialogTitle>{t.sessions.openProject}</DialogTitle>
                <DialogDescription>
                  {t.sessions.projectPathHint}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-1.5">
                <label
                  className="text-xs font-medium"
                  htmlFor="project-path"
                >
                  {t.sessions.projectPath}
                </label>
                <Input
                  aria-invalid={Boolean(error)}
                  autoFocus
                  className="font-ui-mono text-xs"
                  id="project-path"
                  onChange={(event) => setPathInput(event.target.value)}
                  value={pathInput}
                />
                {error ? (
                  <p className="text-xs text-destructive">{error}</p>
                ) : null}
              </div>

              <DialogFooter>
                <Button
                  onClick={closePicker}
                  type="button"
                  variant="outline"
                >
                  {t.common.cancel}
                </Button>
                <Button
                  onClick={() => {
                    setError("");
                    setMode("browse");
                    if (!result) void navigate();
                  }}
                  type="button"
                  variant="outline"
                >
                  <Folder />
                  {t.sessions.browseDirectories}
                </Button>
                <Button disabled={saving || !pathInput.trim()} type="submit">
                  {saving ? t.common.saving : t.sessions.addProject}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{t.sessions.openProject}</DialogTitle>
                <DialogDescription className="truncate font-ui-mono text-xs">
                  {result?.current ?? t.sessions.loadingDirectories}
                </DialogDescription>
              </DialogHeader>

              <div>
                <p className="mb-1.5 text-[11px] font-medium text-muted">
                  {t.sessions.projectLocations}
                </p>
                <div className="flex max-h-20 flex-wrap gap-1 overflow-y-auto">
                  {result?.roots.map((root) => (
                    <Button
                      className="max-w-full font-ui-mono text-[11px]"
                      key={root}
                      onClick={() => void navigate(root)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <span className="truncate">{root}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto border-b border-line-subtle pb-2">
                {result?.breadcrumbs.map((crumb) => (
                  <Button
                    className="shrink-0 font-ui-mono text-[11px]"
                    key={crumb.path}
                    onClick={() => void navigate(crumb.path)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    {crumb.name}
                  </Button>
                ))}
              </div>

              <ScrollArea className="h-[min(55vh,28rem)] rounded-md border border-line-subtle">
                <div className="p-1">
                  {loading ? (
                    <div
                      aria-label={t.sessions.loadingDirectories}
                      className="space-y-1 p-1"
                    >
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-[86%]" />
                      <Skeleton className="h-8 w-[72%]" />
                    </div>
                  ) : (
                    <>
                      {result?.parent ? (
                        <Button
                          className="w-full justify-start"
                          onClick={() =>
                            void navigate(result.parent ?? undefined)
                          }
                          type="button"
                          variant="ghost"
                        >
                          <Folder />
                          {t.sessions.parentDirectory}
                        </Button>
                      ) : null}
                      {result?.directories.map((directory, index) => (
                        <Button
                          className="w-full justify-start font-ui-mono text-xs"
                          key={index}
                          onClick={() => void navigate(directory.path)}
                          title={directory.path}
                          type="button"
                          variant="ghost"
                        >
                          <Folder />
                          <span className="truncate">{directory.name}</span>
                        </Button>
                      ))}
                      {result && !result.directories.length ? (
                        <p className="p-4 text-center text-xs text-dim">
                          {t.sessions.noDirectories}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              </ScrollArea>

              {error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : null}
              <DialogFooter>
                <Button
                  onClick={closePicker}
                  type="button"
                  variant="outline"
                >
                  {t.common.cancel}
                </Button>
                <Button
                  onClick={() => {
                    setMode("input");
                    setError("");
                  }}
                  type="button"
                  variant="outline"
                >
                  {t.sessions.backToPathEntry}
                </Button>
                <Button
                  disabled={!result || loading}
                  onClick={selectCurrent}
                  type="button"
                >
                  {t.sessions.chooseThisFolder}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
