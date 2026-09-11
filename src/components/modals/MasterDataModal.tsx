"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import {
  buildInitialFormValues,
  FormFieldsRenderer,
} from "@/components/ui/FormFieldsRenderer";
import {
  getUniqueFieldWarning,
  validateFormField,
  validateFormFields,
  type FormValue,
} from "@/lib/form-validation";
import { cn } from "@/lib/utils";
import type { FormField, FormSection, HrmsRow } from "@/types/hrms";

type MasterDataModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  submitLabel?: string;
  cancelLabel?: string;
  fields?: FormField[];
  sections?: FormSection[];
  size?: "sm" | "md" | "lg" | "xl";
  initialValues?: HrmsRow;
  existingRows?: HrmsRow[];
  onSubmit: (values: HrmsRow) => void | Promise<void>;
  disableSubmit?: boolean;
  /** Adjust field options/labels from current form values (e.g. cascade selects). */
  adaptFields?: (
    fields: FormField[],
    values: Record<string, FormValue>,
  ) => FormField[];
  /** Derive related values when a field changes (balance, day count, clears). */
  deriveValues?: (
    name: string,
    value: FormValue,
    values: Record<string, FormValue>,
  ) =>
    | Partial<Record<string, FormValue>>
    | void
    | Promise<Partial<Record<string, FormValue>> | void>;
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
  cancelLabel = "Close",
  fields,
  sections,
  size = "lg",
  initialValues,
  existingRows = [],
  onSubmit,
  disableSubmit = false,
  adaptFields,
  deriveValues,
}: MasterDataModalProps) {
  const resolvedFields = useMemo(() => resolveFields(fields, sections), [fields, sections]);
  const isEdit = !!initialValues;
  
  const activeFields = useMemo(
    () => resolvedFields.filter((field) => {
      if (!isEdit && field.hideOnCreate) return false;
      if (isEdit && field.hideOnEdit) return false;
      return true;
    }),
    [resolvedFields, isEdit]
  );
  
  const [values, setValues] = useState<Record<string, FormValue>>({});
  const valuesRef = useRef(values);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);

  const displayFields = useMemo(() => {
    if (!adaptFields) return activeFields;
    return adaptFields(activeFields, values);
  }, [activeFields, adaptFields, values]);

  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  useEffect(() => {
    if (!open) {
      setErrors({});
      setSubmitError("");
      setSubmitting(false);
      setOpenSectionId(null);
      return;
    }
    const initial = buildInitialFormValues(resolvedFields, initialValues);
    valuesRef.current = initial;
    setValues(initial);
    setErrors({});
    setSubmitError("");
    setOpenSectionId(sections?.[0]?.id ?? null);
  }, [open, resolvedFields, initialValues?.id, sections]);

  // Hydrate balance (and related read-only fields) after async balance API returns on edit.
  useEffect(() => {
    if (!open || !initialValues) return;
    const balance = initialValues.Balance_leave;
    if (balance === undefined || balance === null || String(balance).trim() === "") return;

    setValues((prev) => {
      const next = {
        ...prev,
        Balance_leave: String(balance),
        Requires_document:
          (initialValues.Requires_document as FormValue) ?? prev.Requires_document,
        Leave_type: (initialValues.Leave_type as FormValue) ?? prev.Leave_type,
        Leave_code: (initialValues.Leave_code as FormValue) ?? prev.Leave_code,
      };
      valuesRef.current = next;
      return next;
    });
  }, [
    open,
    initialValues?.id,
    initialValues?.Balance_leave,
    initialValues?.Requires_document,
    initialValues?.Leave_type,
    initialValues?.Leave_code,
  ]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const excludeId = initialValues?.id ? String(initialValues.id) : undefined;

  const fieldError = (field: FormField, value: FormValue) =>
    validateFormField(field, value) ??
    getUniqueFieldWarning(field, value, existingRows, excludeId);

  const handleFieldChange = (name: string, value: FormValue) => {
    void (async () => {
      const startedWith = { ...valuesRef.current, [name]: value };
      valuesRef.current = startedWith;
      setValues(startedWith);

      let next = startedWith;
      if (deriveValues) {
        const extra = await deriveValues(name, value, startedWith);
        if (extra && Object.keys(extra).length > 0) {
          // Merge onto the latest form state so a later file pick is not wiped
          // by an in-flight leave/employee derive callback.
          next = { ...valuesRef.current, ...extra };
          valuesRef.current = next;
          setValues(next);
        }
      }

      const field =
        displayFields.find((item) => item.name === name) ??
        resolvedFields.find((item) => item.name === name);
      if (!field) return;

      setErrors((prev) => {
        const nextErrors = { ...prev };
        const error = fieldError(field, next[name]);
        if (error) nextErrors[name] = error;
        else delete nextErrors[name];
        return nextErrors;
      });
    })();
  };

  const buildPayload = (): HrmsRow => {
    const current = valuesRef.current;
    const payload: HrmsRow = {
      ...(initialValues ?? {}),
      id: initialValues?.id ?? `new-${Date.now()}`,
    };

    activeFields.forEach((field) => {
      payload[field.name] = current[field.name] as HrmsRow[string];
      if (field.previewKey && current[field.previewKey] !== undefined) {
        payload[field.previewKey] = current[field.previewKey] as HrmsRow[string];
      }
      if (field.fileNameKey && current[field.fileNameKey] !== undefined) {
        payload[field.fileNameKey] = current[field.fileNameKey] as HrmsRow[string];
      }
    });

    return payload;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const current = valuesRef.current;
    const nextErrors = validateFormFields(displayFields, current);
    displayFields.forEach((field) => {
      if (nextErrors[field.name]) return;
      const uniqueError = getUniqueFieldWarning(
        field,
        current[field.name],
        existingRows,
        excludeId,
      );
      if (uniqueError) nextErrors[field.name] = uniqueError;
    });
    if (
      current.Requires_document === "Yes" ||
      current.Requires_document === "1" ||
      current.Requires_document === true
    ) {
      const hasFile = current.Supporting_document instanceof File;
      const hasExisting = String(current.Document_name ?? "").trim().length > 0;
      if (!hasFile && !hasExisting) {
        nextErrors.Supporting_document = "Attachment is required for this leave type.";
      }
    }
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
        const sectionFields = adaptFields
          ? adaptFields(
              section.fields.filter((field) => {
                if (!isEdit && field.hideOnCreate) return false;
                if (isEdit && field.hideOnEdit) return false;
                return true;
              }),
              values,
            )
          : section.fields;

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
                  fields={sectionFields}
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
        fields={displayFields}
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
            {cancelLabel}
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
