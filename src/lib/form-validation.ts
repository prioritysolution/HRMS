import type { FormField } from "@/types/hrms";
import { isValidDateValue } from "@/lib/date-utils";

export function validateFormField(
  field: FormField,
  value: string | boolean,
): string | undefined {
  if (field.type === "checkbox") return undefined;

  const text = typeof value === "boolean" ? "" : value.trim();

  if (field.required && !text) {
    return `${field.label} is required.`;
  }

  if (!text) return undefined;

  if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    return "Please enter a valid email address.";
  }

  if (field.type === "tel" && text.replace(/\D/g, "").length < 10) {
    return "Please enter a valid phone number.";
  }

  if (field.type === "number" && Number.isNaN(Number(text))) {
    return "Please enter a valid number.";
  }

  if (field.type === "date" && !isValidDateValue(text)) {
    return "Please enter a valid date (dd-mm-yyyy).";
  }

  return undefined;
}

export function validateFormFields(
  fields: FormField[],
  values: Record<string, string | boolean>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  fields.forEach((field) => {
    const error = validateFormField(field, values[field.name] ?? "");
    if (error) errors[field.name] = error;
  });

  return errors;
}
