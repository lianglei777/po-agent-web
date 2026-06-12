import { LoaderCircle } from "lucide-react";
import type { SkillInfo } from "./types";

export function SkillDetail({
  skill,
  saving,
  onToggle,
}: {
  skill: SkillInfo;
  saving: boolean;
  onToggle: () => void;
}) {
  const enabled = !skill.disableModelInvocation;
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-5">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold">{skill.name}</h2>
            <p className="mt-1 text-[13px] leading-5 text-muted">
              {skill.description || "No description provided."}
            </p>
          </div>
          <button
            aria-checked={enabled}
            aria-label="Allow model invocation"
            className={`relative mt-1 h-6 w-11 shrink-0 rounded-full border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 ${
              enabled
                ? "border-accent bg-accent"
                : "border-line bg-selected"
            }`}
            disabled={saving || !skill.canModify}
            onClick={onToggle}
            role="switch"
            type="button"
          >
            <span
              className={`absolute top-0.5 size-4.5 rounded-full bg-panel shadow-sm transition-transform ${
                enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
            {saving ? (
              <LoaderCircle className="absolute inset-0 m-auto size-3 animate-spin text-muted" />
            ) : null}
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-line bg-panel">
          <div className="border-b border-line p-4">
            <h3 className="text-sm font-medium">Model invocation</h3>
            <p className="mt-1 text-xs leading-5 text-muted">
              When off, this skill is omitted from the model prompt. It remains
              available for explicit <code>/skill:{skill.name}</code> calls.
            </p>
          </div>
          <dl className="grid gap-4 p-4 text-sm sm:grid-cols-2">
            <Detail label="Source" value={skill.sourceInfo.source} />
            <Detail label="Scope" value={scopeLabel(skill)} />
            <Detail label="Path" value={skill.displayPath} wide />
          </dl>
        </div>

        <p className="mt-4 rounded-lg bg-hover px-3 py-2 text-xs leading-5 text-muted">
          {!skill.canModify
            ? "This skill was discovered through a symlink and is read-only. "
            : ""}
          Changes affect newly created sessions, restored sessions, or a
          session after its resources are reloaded. The current running session
          is not silently restarted.
        </p>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-xs font-medium text-dim">{label}</dt>
      <dd className="mt-1 break-all font-ui-mono text-xs text-primary">
        {value}
      </dd>
    </div>
  );
}

function scopeLabel(skill: SkillInfo): string {
  if (skill.sourceInfo.scope === "project") return "Project";
  if (skill.sourceInfo.scope === "user") return "Global";
  return "Path";
}
