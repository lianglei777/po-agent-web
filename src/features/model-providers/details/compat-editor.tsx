"use client";

import { useState } from "react";
import {
  getCompatFields,
  type CompatFieldDefinition,
} from "@/contracts/model-compat";
import { useI18n } from "@/i18n/use-i18n";
import {
  controlClassName,
  inputStyle,
  selectStyle,
  SettingsRow,
  SettingsSection,
} from "@/components/ui/settings-form";
import { mergeClasses } from "@/lib/utils";
import { changeCompatValue } from "./compat-editor-state";

interface Props {
  api: string | undefined;
  compat: Record<string, unknown> | undefined;
  inheritedCompat?: Record<string, unknown>;
  onChange: (compat: Record<string, unknown> | undefined) => void;
}

export function CompatEditor({
  api,
  compat,
  inheritedCompat,
  onChange,
}: Props) {
  const { t } = useI18n();
  const fields = getCompatFields(api);
  // 字段描述按 `${api}.${fieldKey}` 查字典；类型上以索引签名访问
  const descriptions = t.models.compatFieldDescriptions as Record<
    string,
    string
  >;

  return (
    <SettingsSection title={t.models.compatibility}>
      <p className="px-4 py-3.5 text-meta leading-4 text-dim">
        {fields.length
          ? t.models.compatibilityDescription
          : t.models.compatibilityUnavailable}
      </p>
      {fields.length > 0 && (
        <details className="border-t border-line-subtle">
          <summary className="cursor-pointer px-3 py-2 text-xs text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {t.models.compatibilitySettings} · {api}
          </summary>
          <div className="border-t border-line-subtle">
            {fields.map((field) => (
              <CompatField
                key={field.key}
                field={field}
                description={descriptions[`${api}.${field.key}`]}
                value={compat?.[field.key]}
                inheritedValue={inheritedCompat?.[field.key]}
                onChange={(value) =>
                  onChange(changeCompatValue(compat, field.key, value))
                }
              />
            ))}
          </div>
        </details>
      )}
    </SettingsSection>
  );
}

function CompatField({
  field,
  description,
  value,
  inheritedValue,
  onChange,
}: {
  field: CompatFieldDefinition;
  description?: string;
  value: unknown;
  inheritedValue: unknown;
  onChange: (value: unknown) => void;
}) {
  const { t } = useI18n();
  const inheritedLabel =
    inheritedValue === undefined
      ? t.models.auto
      : `${t.models.inherited}: ${formatValue(inheritedValue)}`;
  const label = <code className="font-ui-mono">{field.key}</code>;

  if (field.kind === "object") {
    return (
      <SettingsRow
        label={label}
        description={description}
        align="start"
        contentMaxWidth={400}
      >
        <JsonCompatTextarea
          ariaLabel={field.key}
          value={value}
          inheritedLabel={inheritedLabel}
          onChange={onChange}
        />
      </SettingsRow>
    );
  }

  // 带显式默认值且无继承上下文（Provider 级）的布尔字段：渲染为二态，
  // 默认值即默认显示，避免 "Auto" 误导（如 supportsDeveloperRole 默认 false）。
  if (
    field.kind === "boolean" &&
    field.defaultValue !== undefined &&
    inheritedValue === undefined
  ) {
    const resolved =
      typeof value === "boolean" ? value : field.defaultValue;
    return (
      <SettingsRow label={label} description={description}>
        <select
          aria-label={field.key}
          className={controlClassName}
          value={String(resolved)}
          onChange={(event) => onChange(event.target.value === "true")}
          style={selectStyle}
        >
          <option value="true">{t.models.enabled}</option>
          <option value="false">{t.models.disabled}</option>
        </select>
      </SettingsRow>
    );
  }

  return (
    <SettingsRow label={label} description={description}>
      <select
        aria-label={field.key}
        className={controlClassName}
        value={value === undefined ? "" : String(value)}
        onChange={(event) => {
          const next = event.target.value;
          if (!next) onChange(undefined);
          else if (field.kind === "boolean") onChange(next === "true");
          else onChange(next);
        }}
        style={selectStyle}
      >
        <option value="">{inheritedLabel}</option>
        {field.kind === "boolean" ? (
          <>
            <option value="true">{t.models.enabled}</option>
            <option value="false">{t.models.disabled}</option>
          </>
        ) : (
          field.values.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))
        )}
      </select>
    </SettingsRow>
  );
}

function JsonCompatTextarea({
  ariaLabel,
  value,
  inheritedLabel,
  onChange,
}: {
  ariaLabel: string;
  value: unknown;
  inheritedLabel: string;
  onChange: (value: unknown) => void;
}) {
  const { t } = useI18n();
  const [text, setText] = useState(value ? JSON.stringify(value, null, 2) : "");
  const [invalid, setInvalid] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <textarea
        aria-label={ariaLabel}
        className={mergeClasses(
          controlClassName,
          invalid && "border-destructive hover:border-destructive",
        )}
        rows={4}
        value={text}
        placeholder={inheritedLabel}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          if (!next.trim()) {
            setInvalid(false);
            onChange(undefined);
            return;
          }
          try {
            const parsed = JSON.parse(next) as unknown;
            if (
              typeof parsed !== "object" ||
              parsed === null ||
              Array.isArray(parsed)
            ) {
              setInvalid(true);
              return;
            }
            setInvalid(false);
            onChange(parsed);
          } catch {
            setInvalid(true);
          }
        }}
        style={{
          ...inputStyle,
          minHeight: 88,
          resize: "vertical",
          fontFamily: "var(--font-ui-mono)",
        }}
      />
      {invalid && (
        <span className="text-meta text-destructive">
          {t.models.invalidJsonObject}
        </span>
      )}
    </div>
  );
}

function formatValue(value: unknown) {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return value;
  return "JSON";
}
