"use client";

import { DatePicker } from "@/components/ui/DatePicker";
import { FormFieldLabel } from "@/components/ui/FormFieldLabel";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { cn } from "@/lib/utils";
import type { FormField, HrmsRow } from "@/types/hrms";

type FormFieldsRendererProps = {
  fields: FormField[];
  values: Record<string, string | boolean>;
  errors: Record<string, string>;
  onChange: (name: string, value: string | boolean) => void;
};

function isCheckedValue(value: string | boolean | undefined): boolean {
  return value === true || value === "true";
}

export function FormFieldsRenderer({
  fields,
  values,
  errors,
  onChange,
}: FormFieldsRendererProps) {
  return (
    <>
      {fields.map((field) => (
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
          ) : (
            <>
              <FormFieldLabel htmlFor={field.name} label={field.label} required={field.required} />
              {field.type === "select" ? (
                <SearchableSelect
                  id={field.name}
                  name={field.name}
                  value={String(values[field.name] ?? "")}
                  onChange={(nextValue) => onChange(field.name, nextValue)}
                  options={field.options ?? []}
                  placeholder={`Select ${field.label}`}
                  searchPlaceholder={`Search ${field.label.toLowerCase()}...`}
                />
              ) : field.type === "date" ? (
                <DatePicker
                  id={field.name}
                  name={field.name}
                  value={String(values[field.name] ?? "")}
                  onChange={(nextValue) => onChange(field.name, nextValue)}
                  placeholder="dd-mm-yyyy"
                />
              ) : field.type === "textarea" ? (
                <textarea
                  id={field.name}
                  name={field.name}
                  className="form-control"
                  rows={3}
                  value={String(values[field.name] ?? "")}
                  placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}`}
                  onChange={(event) => onChange(field.name, event.target.value)}
                />
              ) : (
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type || "text"}
                  className="form-control"
                  value={String(values[field.name] ?? "")}
                  placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}`}
                  onChange={(event) => onChange(field.name, event.target.value)}
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
      ))}
    </>
  );
}

export function buildInitialFormValues(
  fields: FormField[],
  initialValues?: HrmsRow,
): Record<string, string | boolean> {
  const values: Record<string, string | boolean> = {};

  fields.forEach((field) => {
    const raw = initialValues?.[field.name];
    if (field.type === "checkbox") {
      values[field.name] = raw === true || raw === "true" || raw === 1 || raw === "1";
      return;
    }
    values[field.name] = raw === undefined || raw === null ? "" : String(raw);
  });

  return values;
}
