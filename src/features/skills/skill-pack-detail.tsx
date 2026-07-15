import { AlertTriangle, Box, LoaderCircle, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/use-i18n";
import { packCopy, statusLabel } from "./skill-pack-list";
import type { SkillPackInfo } from "./types";

export function SkillPackDetail({
  pack,
  busy,
  onInstall,
  onRemove,
  onUpdate,
  onRepair,
}: {
  pack: SkillPackInfo;
  busy: boolean;
  onInstall: () => void;
  onRemove: () => void;
  onUpdate: () => void;
  onRepair: () => void;
}) {
  const { t } = useI18n();
  const copy = packCopy(pack);
  const configured = pack.scope !== null;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-start justify-between gap-5 border-b border-line pb-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Box className="size-5 text-accent-deep" />
              <h2 className="text-lg font-semibold">{copy.name}</h2>
              <Badge variant={pack.status === "installed" ? "success" : "outline"}>
                {statusLabel(pack.status, t.skills.packs)}
              </Badge>
              {pack.updateAvailable ? (
                <Badge variant="outline">{t.skills.packs.updateAvailable}</Badge>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">
              {copy.description || t.skills.noDescription}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {pack.status === "available" ? (
              <Action busy={busy} label={t.skills.packs.installAction} onClick={onInstall} />
            ) : null}
            {pack.status === "installed" && pack.canUpdate ? (
              <Action busy={busy} label={t.skills.packs.updateAction} onClick={onUpdate} />
            ) : null}
            {pack.status === "broken" ? (
              <Action busy={busy} label={t.skills.packs.repairAction} onClick={onRepair} />
            ) : null}
            {configured ? (
              <Action
                busy={busy}
                label={t.skills.packs.removeAction}
                onClick={onRemove}
                variant="destructive"
              />
            ) : null}
          </div>
        </header>

        <dl className="grid gap-4 border-b border-line py-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Detail label={t.skills.packs.status} value={statusLabel(pack.status, t.skills.packs)} />
          <Detail label={t.skills.scope} value={scopeLabel(pack, t.skills.packs)} />
          <Detail label={t.skills.packs.currentVersion} value={pack.version ?? t.skills.packs.versionUnknown} />
          <Detail label={t.skills.packs.availableVersion} value={pack.availableVersion ?? t.skills.packs.versionUnknown} />
          <div className="sm:col-span-2 lg:col-span-4">
            <Detail label={t.skills.source} value={pack.source} mono />
          </div>
        </dl>

        {pack.status === "installed" && !pack.canUpdate ? (
          <p className="border-b border-line py-3 text-xs leading-5 text-muted">
            {t.skills.packs.localRefreshHint}
          </p>
        ) : null}

        <section className="py-5">
          <h3 className="text-sm font-semibold">{t.skills.packs.resources}</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <ResourceList label={t.skills.title} values={pack.resources.skills} />
            <ResourceList label={t.skills.packs.extensions} values={pack.resources.extensions} />
            <ResourceList label={t.skills.packs.prompts} values={pack.resources.prompts} />
            <ResourceList label={t.skills.packs.themes} values={pack.resources.themes} />
          </div>
        </section>

        <div className="space-y-3 border-t border-line pt-5">
          <Warning icon={<ShieldAlert />} text={t.skills.packs.securityWarning} />
          {pack.containsExtensions ? (
            <Warning icon={<AlertTriangle />} text={t.skills.packs.extensionWarning} strong />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Action({
  busy,
  label,
  onClick,
  variant = "default",
}: {
  busy: boolean;
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive";
}) {
  return (
    <Button disabled={busy} onClick={onClick} type="button" variant={variant}>
      {busy ? <LoaderCircle className="animate-spin" /> : null}
      {label}
    </Button>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className={`mt-1 break-all ${mono ? "font-ui-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function ResourceList({ label, values }: { label: string; values: string[] }) {
  const { t } = useI18n();
  return (
    <div className="rounded-lg border border-line-subtle bg-panel p-3">
      <h4 className="text-xs font-semibold text-muted">{label}</h4>
      {values.length ? (
        <ul className="mt-2 space-y-1 font-ui-mono text-xs">
          {values.map((value) => <li className="break-all" key={value}>{value}</li>)}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-dim">{t.skills.packs.noResources}</p>
      )}
    </div>
  );
}

function Warning({
  icon,
  text,
  strong = false,
}: {
  icon: React.ReactNode;
  text: string;
  strong?: boolean;
}) {
  return (
    <div className={`flex gap-3 rounded-lg border p-3 text-sm leading-5 ${
      strong
        ? "border-warning/35 bg-warning/8 text-warning"
        : "border-line-subtle bg-panel text-muted"
    }`}>
      <span className="mt-0.5 [&_svg]:size-4">{icon}</span>
      <p>{text}</p>
    </div>
  );
}

function scopeLabel(
  pack: SkillPackInfo,
  t: ReturnType<typeof useI18n>["t"]["skills"]["packs"],
) {
  if (pack.scope === "project") return t.scopeProject;
  if (pack.scope === "user") return t.scopeUser;
  return t.scopeNotInstalled;
}
