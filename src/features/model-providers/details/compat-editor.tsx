"use client";

import { useState } from "react";
import {
  getCompatFields,
  type CompatFieldDefinition,
} from "@/contracts/model-compat";
import { useI18n } from "@/i18n/use-i18n";
import {
  controlClassName,
  Field,
  inputStyle,
  selectStyle,
  SettingsSection,
} from "../form-ui";
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

  return (
    <SettingsSection title={t.models.compatibility}>
      <p className="px-4 py-3.5 text-[11px] leading-4 text-dim">
        {fields.length
          ? t.models.compatibilityDescription
          : t.models.compatibilityUnavailable}
      </p>
      {fields.length > 0 && (
        <details className="border-t border-line-subtle">
          <summary className="cursor-pointer px-3 py-2 text-[12px] text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {t.models.compatibilitySettings} · {api}
          </summary>
          <div className="grid gap-3 border-t border-line-subtle bg-subtle p-4 sm:grid-cols-2">
            {fields.map((field) => (
              <CompatField
                key={field.key}
                field={field}
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
  value,
  inheritedValue,
  onChange,
}: {
  field: CompatFieldDefinition;
  value: unknown;
  inheritedValue: unknown;
  onChange: (value: unknown) => void;
}) {
  const { t } = useI18n();
  const inheritedLabel =
    inheritedValue === undefined
      ? t.models.auto
      : `${t.models.inherited}: ${formatValue(inheritedValue)}`;

  if (field.kind === "object") {
    return (
      <JsonCompatField
        fieldKey={field.key}
        value={value}
        inheritedLabel={inheritedLabel}
        onChange={onChange}
      />
    );
  }

  return (
    <Field label={<code className="font-ui-mono">{field.key}</code>}>
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
    </Field>
  );
}

function JsonCompatField({
  fieldKey,
  value,
  inheritedLabel,
  onChange,
}: {
  fieldKey: string;
  value: unknown;
  inheritedLabel: string;
  onChange: (value: unknown) => void;
}) {
  const { t } = useI18n();
  const [text, setText] = useState(value ? JSON.stringify(value, null, 2) : "");
  const [invalid, setInvalid] = useState(false);

  return (
    <Field label={<code className="font-ui-mono">{fieldKey}</code>}>
      <textarea
        aria-label={fieldKey}
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
        <span className="text-[11px] text-destructive">
          {t.models.invalidJsonObject}
        </span>
      )}
    </Field>
  );
}

function formatValue(value: unknown) {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return value;
  return "JSON";
}
