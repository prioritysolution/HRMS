"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import {
  buildInitialFormValues,
  FormFieldsRenderer,
} from "@/components/ui/FormFieldsRenderer";
import { validateFormField, validateFormFields, type FormValue } from "@/lib/form-validation";
import { cn } from "@/lib/utils";
import type { FormField, FormSection, HrmsRow } from "@/types/hrms";

type MasterDataModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  submitLabel?: string;
  fields?: FormField[];
  sections?: FormSection[];
  size?: "sm" | "md" | "lg" | "xl";
  initialValues?: HrmsRow;
  onSubmit: (values: HrmsRow) => void | Promise<void>;
  disableSubmit?: boolean;
};

function resolveFields(fields: FormField[] | undefined, sections: FormSection[] | undefined): FormField[] {
  if (sections?.length) return sections.flatMap((section) => section.fields);
  return fields ?? [];
}

function findSectionIdForField(sections: FormSection[], fieldName: string): string | undefined {
  return sections.find((section) => section.fields.some((field) => field.name === fieldName))?.id;
}

export function MasterDataModal({
  open,
  onClose,
  title,
  subtitle,
  submitLabel = "Save & Continue",
  fields,
  sections,
  size = "lg",
  initialValues,
  onSubmit,
  disableSubmit = false,
}: MasterDataModalProps) {
  const resolvedFields = useMemo(() => resolveFields(fields, sections), [fields, sections]);
  const isEdit = !!initialValues;
  
  const activeFields = useMemo(
    () => resolvedFields.filter((field) => !(field.hideOnCreate && !isEdit)),
    [resolvedFields, isEdit]
  );
  
  const [values, setValues] = useState<Record<string, FormValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setErrors({});
      setSubmitError("");
      setSubmitting(false);
      setOpenSectionId(null);
      return;
    }
    setValues(buildInitialFormValues(resolvedFields, initialValues));
    setErrors({});
    setSubmitError("");
    setOpenSectionId(sections?.[0]?.id ?? null);
  }, [open, resolvedFields, initialValues?.id, sections]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleFieldChange = (name: string, value: FormValue) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    const field = resolvedFields.find((item) => item.name === name);
    if (!field) return;

    setErrors((prev) => {
      const next = { ...prev };
      const error = validateFormField(field, value);
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
  };

  const buildPayload = (): HrmsRow => {
    const payload: HrmsRow = {
      ...(initialValues ?? {}),
      id: initialValues?.id ?? `new-${Date.now()}`,
    };

    activeFields.forEach((field) => {
      payload[field.name] = values[field.name] as HrmsRow[string];
      if (field.previewKey && values[field.previewKey] !== undefined) {
        payload[field.previewKey] = values[field.previewKey] as HrmsRow[string];
      }
      if (field.fileNameKey && values[field.fileNameKey] !== undefined) {
        payload[field.fileNameKey] = values[field.fileNameKey] as HrmsRow[string];
      }
    });

    return payload;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateFormFields(activeFields, values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      if (sections?.length) {
        const firstErrorField = Object.keys(nextErrors)[0];
        const sectionId = findSectionIdForField(sections, firstErrorField);
        if (sectionId) setOpenSectionId(sectionId);
      }
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      await onSubmit(buildPayload());
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to save this record.");
    } finally {
      setSubmitting(false);
    }
  };

  const formContent = sections?.length ? (
    <div className="form-sections">
      {sections.map((section, index) => {
        const isOpen = openSectionId === section.id;

        return (
          <section key={section.id} className={cn("form-section", isOpen && "is-open")}>
            <button
              type="button"
              className="form-section-header"
              aria-expanded={isOpen}
              aria-controls={`form-section-panel-${section.id}`}
              onClick={() => setOpenSectionId(section.id)}
            >
              <div className="form-section-index">{String(index + 1).padStart(2, "0")}</div>
              <div className="form-section-heading">
                <h3 className="form-section-title">{section.title}</h3>
                {section.description ? (
                  <p className="form-section-description">{section.description}</p>
                ) : null}
              </div>
              <ChevronDown
                size={18}
                className={cn("form-section-chevron", isOpen && "is-open")}
                aria-hidden="true"
              />
            </button>
            {isOpen ? (
              <div
                id={`form-section-panel-${section.id}`}
                className="form-grid form-grid-2 form-section-fields"
              >
                <FormFieldsRenderer
                  fields={section.fields}
                  values={values}
                  errors={errors}
                  onChange={handleFieldChange}
                  isEdit={isEdit}
                />
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  ) : (
    <div className="form-grid form-grid-2">
      <FormFieldsRenderer
        fields={resolvedFields}
        values={values}
        errors={errors}
        onChange={handleFieldChange}
        isEdit={isEdit}
      />
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={handleClose}
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
          <button
            type="submit"
            form="master-data-form"
            className="btn btn-primary"
            disabled={submitting || disableSubmit}
          >
            {submitting ? "Saving..." : submitLabel}
          </button>
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={handleClose}
            disabled={submitting}
          >
            Close
          </button>
        </>
      }
    >
      <form id="master-data-form" className="master-data-form" onSubmit={handleSubmit} noValidate>
        {submitError ? (
          <p className="form-field-error form-span-full" role="alert">
            {submitError}
          </p>
        ) : null}
        {formContent}
      </form>
    </Modal>
  );
}
