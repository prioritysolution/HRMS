import type { FormField } from "@/types/hrms";
import { isValidDateValue } from "@/lib/date-utils";
import { validateImageFile } from "@/lib/file-upload";

export type FormValue = string | boolean | File | null | undefined;

export function validateFormField(field: FormField, value: FormValue): string | undefined {
  if (field.type === "checkbox") return undefined;

  if (field.type === "file") {
    const file = value instanceof File ? value : null;
    if (!file) {
      return field.required ? `${field.label} is required.` : undefined;
    }
    return validateImageFile(file, {
      required: field.required,
      label: field.label,
      maxSizeMb: field.maxSizeMb,
    });
  }

  const text = typeof value === "boolean" || value instanceof File ? "" : String(value ?? "").trim();

  if (field.required && !text) {
    return `${field.label} is required.`;
  }

  if (!text) return undefined;

  if (field.minLength !== undefined && text.length < field.minLength) {
    return `${field.label} must be at least ${field.minLength} characters.`;
  }

  if (field.maxLength !== undefined && text.length > field.maxLength) {
    return `${field.label} must be at most ${field.maxLength} characters.`;
  }

  if (field.pattern && !field.pattern.test(text)) {
    return field.patternMessage || `${field.label} format is invalid.`;
  }

  if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    return "Please enter a valid email address.";
  }

  if (field.type === "tel" && text.replace(/\D/g, "").length < 10) {
    return "Please enter a valid phone number (min 10 digits).";
  }

  if (field.type === "number") {
    const num = Number(text);
    if (Number.isNaN(num)) {
      return "Please enter a valid number.";
    }
    if (field.min !== undefined && num < field.min) {
      return `${field.label} must be at least ${field.min}.`;
    }
    if (field.max !== undefined && num > field.max) {
      return `${field.label} must be at most ${field.max}.`;
    }
  }

  if (field.type === "date" && !isValidDateValue(text)) {
    return "Please enter a valid date (dd-mm-yyyy).";
  }

  return undefined;
}

export function validateFormFields(
  fields: FormField[],
  values: Record<string, FormValue>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  fields.forEach((field) => {
    const error = validateFormField(field, values[field.name]);
    if (error) errors[field.name] = error;
  });

  return errors;
}
