"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/i18n/use-i18n";

export function ConfirmSkillPackDialog({
  operation,
  packName,
  busy,
  onClose,
  onConfirm,
}: {
  operation: "install" | "remove" | null;
  packName: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: (scope: "global" | "project") => void;
}) {
  const { t } = useI18n();
  const [scope, setScope] = useState<"global" | "project">("project");

  const install = operation === "install";
  function close() {
    setScope("project");
    onClose();
  }
  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open && !busy) close();
      }}
      open={operation !== null}
    >
      <DialogContent closeLabel={t.common.close}>
        <DialogHeader>
          <DialogTitle>
            {install ? t.skills.packs.installTitle : t.skills.packs.removeTitle}
          </DialogTitle>
          <DialogDescription>
            {(install
              ? t.skills.packs.installDescription
              : t.skills.packs.removeDescription
            ).replace("{name}", packName)}
          </DialogDescription>
        </DialogHeader>

        {install ? (
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">
              {t.skills.packs.installScope}
            </legend>
            {(["project", "global"] as const).map((value) => (
              <label
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-line-subtle px-3 py-2 text-sm has-[:checked]:border-ring has-[:checked]:bg-selected"
                key={value}
              >
                <input
                  checked={scope === value}
                  name="skill-pack-scope"
                  onChange={() => setScope(value)}
                  type="radio"
                  value={value}
                />
                {value === "project"
                  ? t.skills.packs.installProject
                  : t.skills.packs.installGlobal}
              </label>
            ))}
          </fieldset>
        ) : null}

        <p className="rounded-lg border border-warning/30 bg-warning/8 p-3 text-sm leading-5 text-warning">
          {t.skills.packs.securityWarning}
        </p>

        <DialogFooter>
          <Button disabled={busy} onClick={close} type="button" variant="outline">
            {t.common.cancel}
          </Button>
          <Button
            aria-busy={busy || undefined}
            disabled={busy}
            onClick={() => {
              onConfirm(scope);
              setScope("project");
            }}
            type="button"
            variant={install ? "default" : "destructive"}
          >
            {busy ? <LoaderCircle className="animate-spin" /> : null}
            {install
              ? t.skills.packs.installAction
              : t.skills.packs.removeAction}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
