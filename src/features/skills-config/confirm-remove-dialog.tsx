"use client";

import { LoaderCircle } from "lucide-react";
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

export function ConfirmRemoveDialog({
  open,
  skillName,
  removing,
  onConfirm,
  onClose,
}: {
  open: boolean;
  skillName: string;
  removing: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <Dialog
      onOpenChange={(next) => {
        if (!next && !removing) onClose();
      }}
      open={open}
    >
      <DialogContent closeLabel={t.common.close}>
        <DialogHeader>
          <DialogTitle>{t.skills.removeConfirmTitle}</DialogTitle>
          <DialogDescription>
            {t.skills.removeConfirmDescription.replace("{name}", skillName)}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={removing}
            onClick={onClose}
            type="button"
            variant="outline"
          >
            {t.common.cancel}
          </Button>
          <Button
            aria-busy={removing || undefined}
            disabled={removing}
            onClick={onConfirm}
            type="button"
            variant="destructive"
          >
            {removing ? (
              <LoaderCircle className="animate-spin" />
            ) : null}
            {t.skills.removeConfirmAction}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
