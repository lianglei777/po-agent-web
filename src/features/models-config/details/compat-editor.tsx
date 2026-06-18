"use client";

import { useState } from "react";
import {
  getCompatFields,
  type CompatFieldDefinition,
} from "@/contracts/model-compat";
import { useI18n } from "@/i18n/use-i18n";
import { Field, inputStyle, SectionTitle } from "../shared/form-ui";
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
    <section className="flex flex-col gap-2">
      <SectionTitle>{t.models.compatibility}</SectionTitle>
      <p className="text-[11px] leading-4 text-dim">
        {fields.length
          ? t.models.compatibilityDescription
          : t.models.compatibilityUnavailable}
      </p>
      {fields.length > 0 && (
        <details className="rounded-lg border border-line bg-panel">
          <summary className="cursor-pointer px-3 py-2 text-[12px] text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {t.models.compatibilitySettings} · {api}
          </summary>
          <div className="grid gap-3 border-t border-line p-3 sm:grid-cols-2">
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
    </section>
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
        value={value === undefined ? "" : String(value)}
        onChange={(event) => {
          const next = event.target.value;
          if (!next) onChange(undefined);
          else if (field.kind === "boolean") onChange(next === "true");
          else onChange(next);
        }}
        style={inputStyle}
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
          borderColor: invalid ? "var(--destructive)" : "var(--border)",
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
