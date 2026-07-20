"use client";

import { useState, useCallback, useMemo } from "react";
import { testModelConfig } from "../api";
import { getEffectiveApi } from "@/contracts/model-compat";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  API_OPTIONS,
  type ConfiguredThinkingLevel,
  type ModelEntry,
  type ModelDiscoverySource,
  type ModelsJson,
  type ModelTestState,
  type ModelDiagnostic,
} from "../types";
import { useI18n } from "@/i18n/use-i18n";
import {
  controlClassName,
  SectionTitle,
  SettingsRow,
  SettingsSection,
  inputStyle,
  selectStyle,
} from "../form-ui";
import {
  getDefaultThinkingOnLevel,
  getSourceTone,
  getSupportedConfiguredThinkingLevels,
  isReasoningCapabilityEnabled,
  shouldDisplaySourceBadge,
  shouldLockDiscoveredCapabilities,
} from "./model-detail-state";
import { CompatEditor } from "./compat-editor";
import {
  applyModelDiagnosticPatch,
  changeEntryApi,
} from "./compat-editor-state";

interface Props {
  providerName: string;
  config: ModelsJson;
  model: ModelEntry;
  onChange: (m: ModelEntry) => void;
  onDelete: () => void;
}

export default function ModelDetail({
  providerName,
  config,
  model,
  onChange,
  onDelete,
}: Props) {
  const [testState, setTestState] = useState<ModelTestState>({ phase: "idle" });
  const [testedConfig, setTestedConfig] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { t } = useI18n();
  const currentConfig = JSON.stringify({ providerName, config, model });
  const visibleTestState = useMemo<ModelTestState>(
    () =>
      testedConfig === currentConfig
        ? testState
        : testedConfig
          ? { phase: "stale" }
          : { phase: "idle" },
    [currentConfig, testState, testedConfig],
  );
  const provider = config.providers?.[providerName];
  const effectiveApi = getEffectiveApi(provider?.api, model.api);
  const source = model.provenance?.source;
  const hasImageInput = model.input?.includes("image") ?? false;
  const capabilitiesLocked = shouldLockDiscoveredCapabilities(source);
  const supportedThinkingLevels = getSupportedConfiguredThinkingLevels(model);
  const defaultThinkingLevel = getDefaultThinkingOnLevel(model);
  const reasoningEnabled = isReasoningCapabilityEnabled(model);

  const runTest = useCallback(async (
    testConfig: ModelsJson,
    testModel: ModelEntry,
  ) => {
    if (!testModel.id.trim()) return;
    const fingerprint = JSON.stringify({
      providerName,
      config: testConfig,
      model: testModel,
    });
    setTestedConfig(fingerprint);
    setTestState({ phase: "testing" });
    try {
      const result = await testModelConfig({
        provider: providerName,
        modelId: testModel.id.trim(),
        config: testConfig,
        timeoutMs: 15_000,
      });
      if (!result.ok) {
        setTestState({
          phase: "error",
          message:
            result.diagnostic?.summary ??
            result.error ??
            t.models.modelTestFailed,
          latencyMs: result.latencyMs,
          diagnostic: result.diagnostic,
          checkedAt: result.verification.checkedAt,
        });
      } else {
        setTestState({
          phase: "success",
          latencyMs: result.latencyMs,
          responseText: result.responseText,
          checkedAt: result.verification.checkedAt,
        });
      }
    } catch (e) {
      setTestState({
        phase: "error",
        message: e instanceof Error ? e.message : t.models.unknownError,
      });
    }
  }, [
    providerName,
    t.models.modelTestFailed,
    t.models.unknownError,
  ]);

  const handleTest = useCallback(async () => {
    if (!model.id.trim() || visibleTestState.phase === "testing") return;
    await runTest(config, model);
  }, [config, model, runTest, visibleTestState.phase]);

  const applySuggestionAndRetest = useCallback(async () => {
    const diagnostic =
      visibleTestState.phase === "error"
        ? visibleTestState.diagnostic
        : undefined;
    const patch = diagnostic?.suggestedPatch;
    if (!patch) return;
    const nextModel = applyModelDiagnosticPatch(model, effectiveApi, patch);
    if (nextModel === model) return;
    const nextConfig: ModelsJson = {
      ...config,
      providers: {
        ...(config.providers ?? {}),
        [providerName]: {
          ...provider,
          models: (provider?.models ?? []).map((candidate) =>
            candidate === model ? nextModel : candidate,
          ),
        },
      },
    };
    onChange(nextModel);
    await runTest(nextConfig, nextModel);
  }, [
    config,
    effectiveApi,
    model,
    onChange,
    provider,
    providerName,
    runTest,
    visibleTestState,
  ]);

  const copyModelId = useCallback(async () => {
    if (!model.id) return;
    await navigator.clipboard?.writeText(model.id);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }, [model.id]);

  let testSummary: string | null = null;
  let testBorderColor = "var(--border)";
  let testBgColor = "var(--bg-panel)";

  if (visibleTestState.phase === "testing") {
    testSummary = t.models.testingConnection;
  } else if (visibleTestState.phase === "stale") {
    testSummary = t.models.stale;
  } else if (visibleTestState.phase === "success") {
    testSummary = `${t.models.connected} | ${visibleTestState.latencyMs ?? "?"}ms${
      visibleTestState.responseText ? ` | ${visibleTestState.responseText}` : ""
    }`;
    testBorderColor = "rgba(22,163,74,0.25)";
    testBgColor = "rgba(22,163,74,0.08)";
  } else if (visibleTestState.phase === "error") {
    testSummary = `${t.models.failed} | ${visibleTestState.latencyMs ?? "?"}ms | ${visibleTestState.message}`;
    testBorderColor = "rgba(220,38,38,0.25)";
    testBgColor = "rgba(220,38,38,0.08)";
  }

  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col gap-6 pb-6">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <SectionTitle>
            {t.models.model} · {providerName}
          </SectionTitle>
          <h1 className="mt-1 truncate font-ui-mono text-lg font-semibold text-primary">
            {model.name || model.id}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {testSummary && (
            <span
              title={testSummary}
              className="inline-flex h-6 max-w-[260px] items-center overflow-hidden text-ellipsis whitespace-nowrap rounded border px-2 text-[11px]"
              style={{
                borderColor: testBorderColor,
                background: testBgColor,
                color: "var(--text)",
                boxSizing: "border-box",
              }}
            >
              {testSummary}
            </span>
          )}
          <button
            onClick={handleTest}
            disabled={!model.id.trim() || visibleTestState.phase === "testing"}
            className="flex items-center gap-1 rounded px-2 py-[3px] text-[11px]"
            style={{
              background:
                visibleTestState.phase === "success" ? "var(--success)" : "none",
              border:
                visibleTestState.phase === "success"
                  ? "1px solid var(--success)"
                  : "1px solid var(--border)",
              color:
                visibleTestState.phase === "success"
                  ? "var(--primary-foreground)"
                  : !model.id.trim() || visibleTestState.phase === "testing"
                    ? "var(--text-dim)"
                    : "var(--text-muted)",
              cursor:
                !model.id.trim() || visibleTestState.phase === "testing"
                  ? "not-allowed"
                  : "pointer",
            }}
            type="button"
          >
            {visibleTestState.phase === "success" && <CheckIcon />}
            {visibleTestState.phase === "testing"
              ? t.models.testing
              : visibleTestState.phase === "success"
                ? t.models.ok
                : t.models.test}
          </button>
          <button
            onClick={() => setConfirmingDelete(true)}
            className="cursor-pointer rounded border px-2 py-[3px] text-[11px]"
            style={{
              borderColor: "color-mix(in srgb, var(--destructive) 30%, transparent)",
              color: "var(--destructive)",
              background: "none",
            }}
            type="button"
          >
            {t.models.remove}
          </button>
        </div>
      </header>

      <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <DialogContent
          className="z-[1101] sm:max-w-[420px]"
          closeLabel={t.common.close}
          overlayClassName="z-[1100]"
        >
          <DialogHeader>
            <DialogTitle>{t.models.removeModelTitle}</DialogTitle>
            <DialogDescription>
              {t.models.removeModelDescription.replace(
                "{model}",
                model.name || model.id,
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              autoFocus
              type="button"
              variant="outline"
              onClick={() => setConfirmingDelete(false)}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setConfirmingDelete(false);
                onDelete();
              }}
            >
              {t.models.removeModelAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-[11px] leading-4 text-dim">
        {t.models.realRequestCostNotice}
      </p>

      {visibleTestState.phase === "error" &&
        visibleTestState.diagnostic && (
          <DiagnosticPanel
            diagnostic={visibleTestState.diagnostic}
            onApplyAndRetest={() => void applySuggestionAndRetest()}
          />
        )}

      <SettingsSection title={t.models.general}>
        <SettingsRow label={t.models.id}>
          <div
            className="flex min-h-8 items-center gap-2 rounded border px-2.5 text-[12px]"
            style={{
              background: "var(--bg-subtle)",
              borderColor: "var(--border-strong)",
              color: "var(--text)",
            }}
          >
            <span className="min-w-0 flex-1 truncate font-ui-mono">
              {model.id}
            </span>
            <SourceBadge source={source} />
            <button
              className="rounded px-1.5 py-0.5 text-[11px] text-muted hover:bg-hover hover:text-primary"
              disabled={!model.id}
              onClick={() => void copyModelId()}
              type="button"
            >
              {copied ? t.models.copied : t.models.copyId}
            </button>
          </div>
        </SettingsRow>
        <SettingsRow label={t.models.name}>
          <input
            className={controlClassName}
            value={model.name ?? ""}
            onChange={(e) =>
              onChange({
                ...model,
                name: e.target.value || undefined,
              })
            }
            style={{ ...inputStyle }}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={t.models.capabilities}>
        <SettingsRow label={t.models.imageInput}>
          <CapabilityToggle
            checked={hasImageInput}
            disabled={capabilitiesLocked}
            label={t.models.imageInput}
            onChange={(checked) =>
              onChange({
                ...model,
                input: checked ? ["text", "image"] : ["text"],
              })
            }
            source={source}
          />
        </SettingsRow>
        <SettingsRow label={t.models.reasoningThinking}>
          <CapabilityToggle
            checked={reasoningEnabled}
            disabled={capabilitiesLocked}
            label={t.models.reasoningThinking}
            onChange={(checked) =>
              onChange({
                ...model,
                reasoning: checked,
                thinkingDefaultLevel: checked
                  ? (model.thinkingDefaultLevel ??
                    defaultThinkingLevel ??
                    "high")
                  : undefined,
              })
            }
            source={source}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title={t.models.advanced}>
        <SettingsRow
          label={t.models.apiProtocol}
          description={t.models.apiProtocolDescription}
        >
          <select
            className={controlClassName}
            value={model.api ?? ""}
            onChange={(e) =>
              onChange(changeEntryApi(model, e.target.value || undefined))
            }
            style={{
              ...selectStyle,
              color: model.api ? "var(--text)" : "var(--text-dim)",
            }}
          >
            <option value="">{t.models.inheritNone}</option>
            {API_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </SettingsRow>

        {reasoningEnabled && supportedThinkingLevels.length > 0 && (
          <SettingsRow
            label={t.models.thinkingOnDefault}
            description={t.models.thinkingOnDefaultDescription}
          >
            <select
              className={controlClassName}
              value={model.thinkingDefaultLevel ?? defaultThinkingLevel ?? "high"}
              onChange={(event) =>
                onChange({
                  ...model,
                  thinkingDefaultLevel: event.target
                    .value as ConfiguredThinkingLevel,
                })
              }
              style={{ ...selectStyle }}
            >
              {supportedThinkingLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </SettingsRow>
        )}
      </SettingsSection>

      <CompatEditor
        api={effectiveApi}
        compat={model.compat}
        inheritedCompat={provider?.compat}
        onChange={(compat) => onChange({ ...model, compat })}
      />
    </div>
  );
}

function DiagnosticPanel({
  diagnostic,
  onApplyAndRetest,
}: {
  diagnostic: ModelDiagnostic;
  onApplyAndRetest: () => void;
}) {
  const { t } = useI18n();
  return (
    <section
      aria-live="polite"
      className="rounded-lg border p-3"
      style={{
        borderColor: "rgba(220,38,38,0.25)",
        background: "rgba(220,38,38,0.06)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-ui-mono text-[11px] text-destructive">
            {diagnostic.code}
          </div>
          <p className="mt-1 text-[12px] leading-5 text-primary">
            {diagnostic.summary}
          </p>
        </div>
        {diagnostic.suggestedPatch && (
          <button
            type="button"
            onClick={onApplyAndRetest}
            className="shrink-0 rounded border border-line bg-panel px-2.5 py-1.5 text-[11px] text-primary hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t.models.applySuggestionAndRetest}
          </button>
        )}
      </div>
      {diagnostic.suggestedPatch && (
        <div className="mt-2 rounded border border-line bg-panel p-2">
          <div className="text-[11px] font-medium text-muted">
            {t.models.suggestedChange}
          </div>
          <pre className="mt-1 overflow-x-auto font-ui-mono text-[11px] leading-4 text-primary">
            {JSON.stringify(diagnostic.suggestedPatch.changes, null, 2)}
          </pre>
          <p className="mt-1 text-[11px] leading-4 text-dim">
            {diagnostic.suggestedPatch.reason}
          </p>
        </div>
      )}
      {diagnostic.technicalMessage && (
        <details className="mt-2">
          <summary className="cursor-pointer text-[11px] text-muted">
            {t.models.diagnosticDetails}
          </summary>
          <pre className="mt-1 max-h-36 overflow-auto whitespace-pre-wrap break-words rounded border border-line bg-panel p-2 font-ui-mono text-[11px] leading-4 text-muted">
            {diagnostic.technicalMessage}
          </pre>
        </details>
      )}
    </section>
  );
}

function CapabilityToggle({
  checked,
  disabled,
  label,
  onChange,
  source,
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  source?: ModelDiscoverySource;
}) {
  return (
    <div className="flex items-center justify-end gap-2.5">
      <SourceBadge source={source} />
      <label
        className={`inline-flex items-center ${
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <span className="sr-only">{label}</span>
        <input
          checked={checked}
          className="peer sr-only"
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
        <span
          aria-hidden="true"
          className="relative h-5 w-9 rounded-full bg-line-strong transition-colors after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-elevated after:transition-transform peer-checked:bg-accent peer-checked:after:translate-x-4 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 motion-reduce:transition-none motion-reduce:after:transition-none"
        />
      </label>
    </div>
  );
}

function SourceBadge({
  source,
}: {
  source?: ModelDiscoverySource;
}) {
  const { t } = useI18n();
  if (!shouldDisplaySourceBadge(source)) return null;
  const label = sourceLabel(t.models, source);
  const tone = getSourceTone(source);
  return (
    <span
      className="shrink-0 rounded-full border px-1.5 py-0.5 text-[10px]"
      style={{
        borderColor:
          tone === "known"
            ? "rgba(22,163,74,0.25)"
            : tone === "partial"
              ? "rgba(113,113,122,0.28)"
              : "var(--border)",
        color: tone === "known" ? "var(--success)" : "var(--text-dim)",
        background:
          tone === "known" ? "rgba(22,163,74,0.08)" : "var(--bg-panel)",
      }}
      title={label}
    >
      {label}
    </span>
  );
}

function sourceLabel(
  models: ReturnType<typeof useI18n>["t"]["models"],
  source?: ModelDiscoverySource,
) {
  if (source === "catalog") return models.sourceCatalog;
  if (source === "inferred") return models.sourceInferred;
  if (source === "remote") return models.sourceRemote;
  if (source === "defaulted") return models.sourceDefaulted;
  return "";
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
