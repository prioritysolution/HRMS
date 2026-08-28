"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import {
  buildInitialFormValues,
  FormFieldsRenderer,
} from "@/components/ui/FormFieldsRenderer";
import { validateFormField, validateFormFields } from "@/lib/form-validation";
import type { FormField, HrmsRow } from "@/types/hrms";

type MasterDataModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  submitLabel?: string;
  fields: FormField[];
  size?: "sm" | "md" | "lg" | "xl";
  initialValues?: HrmsRow;
  onSubmit: (values: HrmsRow) => void;
};

export function MasterDataModal({
  open,
  onClose,
  title,
  subtitle,
  submitLabel = "Save & Continue",
  fields,
  size = "lg",
  initialValues,
  onSubmit,
}: MasterDataModalProps) {
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setErrors({});
      return;
    }
    setValues(buildInitialFormValues(fields, initialValues));
    setErrors({});
  }, [open, fields, initialValues?.id]);

  const handleFieldChange = (name: string, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    const field = fields.find((item) => item.name === name);
    if (!field) return;

    setErrors((prev) => {
      const next = { ...prev };
      const error = validateFormField(field, value);
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateFormFields(fields, values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload: HrmsRow = { id: initialValues?.id ?? `new-${Date.now()}` };
    fields.forEach((field) => {
      payload[field.name] = values[field.name];
    });

    onSubmit(payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={
        subtitle ??
        (title.toLowerCase().startsWith("edit")
          ? `Update ${title.replace(/^Edit\s+/i, "").toLowerCase()} details.`
          : `Create a new ${title.replace(/^Add\s+/i, "").toLowerCase()} record.`)
      }
      size={size}
      footer={
        <>
          <button type="submit" form="master-data-form" className="btn btn-primary">
            {submitLabel}
          </button>
          <button type="button" className="btn btn-outline-danger" onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      <form id="master-data-form" className="form-grid form-grid-2" onSubmit={handleSubmit} noValidate>
        <FormFieldsRenderer
          fields={fields}
          values={values}
          errors={errors}
          onChange={handleFieldChange}
        />
      </form>
    </Modal>
  );
}
