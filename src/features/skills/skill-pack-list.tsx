import { AlertTriangle, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n/use-i18n";
import type { SkillPackInfo } from "./types";

export function SkillPackList({
  packs,
  selectedPackId,
  onSelect,
}: {
  packs: SkillPackInfo[];
  selectedPackId: string | null;
  onSelect: (packId: string) => void;
}) {
  const { t } = useI18n();

  return (
    <div
      aria-label={t.skills.packs.tabPacks}
      className="min-h-0 flex-1 overflow-y-auto p-2"
      role="listbox"
    >
      {packs.map((pack) => {
        const selected = pack.packId === selectedPackId;
        const copy = packCopy(pack);
        return (
          <button
            aria-selected={selected}
            className={`mb-1 w-full rounded-lg px-2.5 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 ${
              selected ? "bg-selected" : "hover:bg-hover"
            }`}
            key={pack.packId}
            onClick={() => onSelect(pack.packId)}
            role="option"
            type="button"
          >
            <span className="flex items-start gap-2">
              {pack.status === "broken" ? (
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              ) : (
                <Package className="mt-0.5 size-4 shrink-0 text-accent-deep" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {copy.name}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant={statusVariant(pack.status)}>
                    {statusLabel(pack.status, t.skills.packs)}
                  </Badge>
                  <span className="text-[11px] text-muted">
                    {t.skills.packs.skillCount.replace(
                      "{count}",
                      String(pack.resources.skills.length),
                    )}
                  </span>
                </span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function packCopy(pack: SkillPackInfo) {
  return { name: pack.name, description: pack.description };
}

export function statusLabel(
  status: SkillPackInfo["status"],
  t: ReturnType<typeof useI18n>["t"]["skills"]["packs"],
): string {
  if (status === "installed") return t.statusInstalled;
  if (status === "broken") return t.statusBroken;
  return t.statusAvailable;
}

function statusVariant(status: SkillPackInfo["status"]) {
  if (status === "installed") return "success" as const;
  if (status === "broken") return "destructive" as const;
  return "outline" as const;
}
