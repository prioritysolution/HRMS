"use client";

import { useI18n, translateHrmsLookup } from "@/i18n";

type FormFieldLabelProps = {
  htmlFor: string;
  label: string;
  required?: boolean;
};

export function FormFieldLabel({ htmlFor, label, required }: FormFieldLabelProps) {
  const { language } = useI18n();
  const displayLabel = translateHrmsLookup(language, "labels", label);

  return (
    <label className="form-field-label" htmlFor={htmlFor}>
      {displayLabel}
      {required ? <span className="field-required">*</span> : null}
    </label>
  );
}
