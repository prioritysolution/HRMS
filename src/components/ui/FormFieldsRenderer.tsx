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
  isEdit?: boolean;
};

function isCheckedValue(value: FormValue): boolean {
  return value === true || value === "true";
}

function asText(value: FormValue): string {
  if (value === undefined || value === null || typeof value === "boolean" || value instanceof File) {
    return "";
  }
  return String(value);
}

function resolveExistingFileUrl(field: FormField, url: string): string {
  if (!url || /^(https?:|blob:|data:)/i.test(url)) return url;
  if (field.name === "Photo") {
    return resolvePublicFileUrl(url, "storage/employees/photos");
  }
  return resolvePublicFileUrl(url);
}

export function FormFieldsRenderer({
  fields,
  values,
  errors,
  onChange,
  isEdit = false,
}: FormFieldsRendererProps) {
  const visibleFields = fields.filter((field) => !(field.hideOnCreate && !isEdit));

  return (
    <>
      {visibleFields.map((field) => {
        const isDisabled = field.readOnlyOnEdit && isEdit;
        return (
          <div
          key={field.name}
          className={cn(
            "form-field",
            field.span === "full" || field.type === "textarea" ? "form-span-full" : undefined,
            errors[field.name] && "is-invalid",
          )}
        >
          {field.type === "checkbox" ? (
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
                  className="form-control"
                  value={asText(values[field.name])}
                  placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}`}
                  onChange={(event) => onChange(field.name, event.target.value)}
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
      values[field.name] = null;
      if (field.previewKey) {
        values[field.previewKey] = asText(initialValues?.[field.previewKey] as FormValue);
      }
      if (field.fileNameKey) {
        values[field.fileNameKey] = asText(initialValues?.[field.fileNameKey] as FormValue);
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
