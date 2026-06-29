"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useI18n } from "@/i18n/use-i18n";
import { loadDefaultCwd } from "./api";

export function CwdPicker({
  onChange,
}: {
  onChange: (cwd: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    function close(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setCustom(false);
        setValue("");
      }
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  useEffect(() => {
    if (custom) inputRef.current?.focus();
  }, [custom]);

  function select(nextCwd: string) {
    onChange(nextCwd);
    setOpen(false);
    setCustom(false);
    setValue("");
    setError("");
  }

  async function useDefault() {
    try {
      select((await loadDefaultCwd()).cwd);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.sessions.unableToLoadDirectory);
    }
  }

  function submitCustom() {
    const next = value.trim();
    if (next) select(next);
    else setCustom(false);
  }

  return (
    <div className="relative" ref={rootRef}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-expanded={open}
            aria-label={t.workspace.openProject}
            onClick={() => setOpen((current) => !current)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <Plus />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t.workspace.openProject}</TooltipContent>
      </Tooltip>

      {open ? (
        <div className="absolute top-full right-0 z-100 mt-1 w-64 rounded-lg border border-line-strong bg-popover p-1.5 shadow-[var(--shadow-floating)]">
          {custom ? (
            <div className="space-y-1.5 p-1">
              <Input
                aria-label={t.sessions.customProjectPath}
                className="h-8 font-ui-mono text-[11px]"
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitCustom();
                  if (event.key === "Escape") {
                    setCustom(false);
                    setValue("");
                  }
                }}
                placeholder={t.sessions.absolutePath}
                ref={inputRef}
                value={value}
              />
              <div className="flex gap-1">
                <Button className="flex-1" onClick={submitCustom} size="sm">
                  {t.common.open}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setCustom(false);
                    setValue("");
                  }}
                  size="sm"
                  variant="ghost"
                >
                  {t.common.cancel}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button
                className="h-8 w-full justify-start text-[11px]"
                onClick={useDefault}
                type="button"
                variant="ghost"
              >
                {t.sessions.useDefaultDirectory}
              </Button>
              <Button
                className="h-8 w-full justify-start text-[11px]"
                onClick={() => setCustom(true)}
                type="button"
                variant="ghost"
              >
                {t.sessions.customPath}
              </Button>
            </>
          )}
          {error ? (
            <p className="m-1 text-[11px] text-destructive">{error}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
