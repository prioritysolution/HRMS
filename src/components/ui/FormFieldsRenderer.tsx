"use client";

import { DatePicker } from "@/components/ui/DatePicker";
import { FileUploadField } from "@/components/ui/FileUploadField";
import { FormFieldLabel } from "@/components/ui/FormFieldLabel";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { resolvePublicFileUrl } from "@/lib/env";
import { cn } from "@/lib/utils";
import type { FormValue } from "@/lib/form-validation";
import type { FormField, HrmsRow } from "@/types/hrms";

type FormFieldsRendererProps = {
  fields: FormField[];
  values: Record<string, FormValue>;
  errors: Record<string, string>;
  onChange: (name: string, value: FormValue) => void;
  onBlur?: (name: string, value: FormValue) => void;
  isEdit?: boolean;
};

function isCheckedValue(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

function numberFloor(field: FormField): number | undefined {
  if (field.type !== "number" || field.allowNegative) return undefined;
  return field.min ?? 0;
}

function clampNumberValue(raw: string, min?: number, max?: number): string {
  if (raw === "") return "";
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return "";

  let next = Math.trunc(parsed);
  if (min !== undefined && next < min) next = min;
  if (max !== undefined && next > max) next = max;
  return String(next);
}

function sanitizeNonNegativeInput(raw: string, min: number, max?: number): string {
  if (raw === "" || raw === "-" || raw === ".") return raw === "." ? raw : "";
  if (raw.endsWith(".") && /^\d+\.$/.test(raw)) return raw;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return "";
  if (parsed < min) return String(min);
  if (max !== undefined && parsed > max) return String(max);
  return raw;
}

function asText(value: FormValue): string {
  if (value === undefined || value === null || typeof value === "boolean" || value instanceof File) {
    return "";
  }
  return String(value);
}

function resolveExistingFileUrl(field: FormField, url: string): string {
  if (!url || /^(https?:|blob:|data:)/i.test(url)) return url;
  const trimmed = url.trim();
  const hasFolder = trimmed.includes("/") || trimmed.includes("\\");
  if (hasFolder) {
    return resolvePublicFileUrl(trimmed);
  }
  if (field.name === "Photo") {
    return resolvePublicFileUrl(trimmed, "storage/employees/photos");
  }
  return resolvePublicFileUrl(trimmed);
}

export function FormFieldsRenderer({
  fields,
  values,
  errors,
  onChange,
  onBlur,
  isEdit = false,
}: FormFieldsRendererProps) {
  const visibleFields = fields.filter((field) => {
    if (!isEdit && field.hideOnCreate) return false;
    if (isEdit && field.hideOnEdit) return false;
    return true;
  });

  return (
    <>
      {visibleFields.map((field) => {
        const isDisabled = field.readOnlyOnEdit && isEdit;
        const floor = numberFloor(field);
        return (
          <div
          key={field.name}
          className={cn(
            "form-field",
            field.span === "full" || field.type === "textarea" ? "form-span-full" : undefined,
            errors[field.name] && "is-invalid",
          )}
        >
          {field.type === "radio" ? (
            <>
              <FormFieldLabel htmlFor={field.name} label={field.label} required={field.required} />
              <div className="radio-row" role="radiogroup" aria-label={field.label}>
                {(field.options ?? []).map((option) => {
                  const optionValue = typeof option === "string" ? option : option.value;
                  const optionLabel = typeof option === "string" ? option : option.label;
                  return (
                    <label key={optionValue} className="check-label" htmlFor={`${field.name}-${optionValue}`}>
                      <input
                        id={`${field.name}-${optionValue}`}
                        type="radio"
                        name={field.name}
                        value={optionValue}
                        checked={asText(values[field.name]) === optionValue}
                        onChange={() => onChange(field.name, optionValue)}
                        disabled={isDisabled}
                      />
                      {optionLabel}
                    </label>
                  );
                })}
              </div>
              {errors[field.name] ? (
                <p className="form-field-error" role="alert">
                  {errors[field.name]}
                </p>
              ) : null}
            </>
          ) : field.type === "checkbox" ? (
            <>
              <label className="check-label mt-2">
                <input
                  type="checkbox"
                  name={field.name}
                  checked={isCheckedValue(values[field.name])}
                  onChange={(event) => onChange(field.name, event.target.checked)}
                  disabled={isDisabled}
                />
                {field.label}
                {field.required ? <span className="field-required">*</span> : null}
              </label>
              {errors[field.name] ? (
                <p className="form-field-error" role="alert">
                  {errors[field.name]}
                </p>
              ) : null}
            </>
          ) : field.type === "file" ? (
            <FileUploadField
              id={field.name}
              name={field.name}
              label={field.label}
              required={field.required}
              accept={field.accept}
              maxSizeMb={field.maxSizeMb}
              hint={field.hint}
              file={values[field.name] instanceof File ? (values[field.name] as File) : null}
              existingUrl={
                values[field.name] instanceof File
                  ? ""
                  : resolveExistingFileUrl(
                      field,
                      asText(field.previewKey ? values[field.previewKey] : values[field.name]),
                    )
              }
              existingName={
                values[field.name] instanceof File
                  ? ""
                  : asText(field.fileNameKey ? values[field.fileNameKey] : "")
              }
              error={errors[field.name]}
              disabled={isDisabled}
              onChange={(file) => {
                onChange(field.name, file);
                if (file) return;
                if (field.previewKey) onChange(field.previewKey, "");
                if (field.fileNameKey) onChange(field.fileNameKey, "");
              }}
            />
          ) : (
            <>
              <FormFieldLabel htmlFor={field.name} label={field.label} required={field.required} />
              {field.type === "select" ? (
                <SearchableSelect
                  id={field.name}
                  name={field.name}
                  value={asText(values[field.name])}
                  onChange={(nextValue) => onChange(field.name, nextValue)}
                  options={field.options ?? []}
                  placeholder={`Select ${field.label}`}
                  searchPlaceholder={`Search ${field.label.toLowerCase()}...`}
                  disabled={isDisabled}
                />
              ) : field.type === "date" ? (
                <DatePicker
                  id={field.name}
                  name={field.name}
                  value={asText(values[field.name])}
                  onChange={(nextValue) => onChange(field.name, nextValue)}
                  placeholder="dd-mm-yyyy"
                  disabled={isDisabled}
                />
              ) : field.type === "textarea" ? (
                <textarea
                  id={field.name}
                  name={field.name}
                  className="form-control"
                  rows={3}
                  value={asText(values[field.name])}
                  placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}`}
                  onChange={(event) => onChange(field.name, event.target.value)}
                  disabled={isDisabled}
                />
            ) : field.type === "multi-select" ? (
                <MultiSelect
                  id={field.name}
                  name={field.name}
                  value={asText(values[field.name])}
                  onChange={(nextValue) => onChange(field.name, nextValue)}
                  options={field.options ?? []}
                  placeholder={`Select ${field.label}`}
                  searchPlaceholder={`Search ${field.label.toLowerCase()}...`}
                  disabled={isDisabled}
                />
              ) : (
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type || "text"}
                  className={cn(
                    "form-control",
                    field.min !== undefined && field.min >= 0 && "no-number-spin",
                  )}
                  value={asText(values[field.name])}
                  placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}`}
                  min={field.type === "number" ? (floor ?? field.min) : undefined}
                  max={field.type === "number" ? field.max : undefined}
                  step={field.type === "number" ? 1 : undefined}
                  inputMode={floor !== undefined ? "decimal" : undefined}
                  onKeyDown={
                    floor !== undefined
                      ? (event) => {
                          if (["-", "+", "e", "E"].includes(event.key)) {
                            event.preventDefault();
                          }
                        }
                      : undefined
                  }
                  onWheel={
                    floor !== undefined
                      ? (event) => {
                          event.preventDefault();
                          const current =
                            event.currentTarget.value === ""
                              ? floor
                              : Number(event.currentTarget.value);
                          const base = Number.isFinite(current) ? current : floor;
                          const next = base + (event.deltaY < 0 ? 1 : -1);
                          onChange(
                            field.name,
                            clampNumberValue(String(next), floor, field.max),
                          );
                        }
                      : undefined
                  }
                  onChange={(event) => {
                    if (floor !== undefined) {
                      onChange(
                        field.name,
                        sanitizeNonNegativeInput(event.target.value, floor, field.max),
                      );
                      return;
                    }
                    onChange(field.name, event.target.value);
                  }}
                  onBlur={(event) => onBlur?.(field.name, event.currentTarget.value)}
                  disabled={isDisabled}
                />
              )}
              {errors[field.name] ? (
                <p className="form-field-error" role="alert">
                  {errors[field.name]}
                </p>
              ) : null}
            </>
          )}
        </div>
        );
      })}
    </>
  );
}

export function buildInitialFormValues(
  fields: FormField[],
  initialValues?: HrmsRow,
): Record<string, FormValue> {
  const values: Record<string, FormValue> = {};

  fields.forEach((field) => {
    if (field.type === "file") {
      const raw = initialValues?.[field.name];
      values[field.name] = raw instanceof File ? raw : null;

      const previewFromKey = field.previewKey
        ? asText(initialValues?.[field.previewKey] as FormValue)
        : "";
      const previewFromValue = raw instanceof File ? "" : asText(raw as FormValue);
      const preview = previewFromKey || previewFromValue;

      if (field.previewKey) {
        values[field.previewKey] = preview;
      } else if (preview) {
        values[field.name] = preview;
      }

      if (field.fileNameKey) {
        values[field.fileNameKey] =
          asText(initialValues?.[field.fileNameKey] as FormValue) || preview;
      }
      return;
    }

    const raw = initialValues?.[field.name];
    if (field.type === "checkbox") {
      const source = raw === undefined || raw === null || raw === "" ? field.defaultValue : raw;
      values[field.name] = source === true || source === "true" || source === 1 || source === "1";
      return;
    }
    values[field.name] =
      raw === undefined || raw === null || raw === "" || raw instanceof File
        ? (field.defaultValue ?? "")
        : String(raw);
  });

  return values;
}
