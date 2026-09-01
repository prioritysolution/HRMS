"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { Modal } from "@/components/ui/Modal";
import {
  buildInitialFormValues,
  FormFieldsRenderer,
} from "@/components/ui/FormFieldsRenderer";
import { ONBOARDING_FORM_SECTIONS } from "@/config/onboarding-form-sections";
import { validateFormField, validateFormFields, type FormValue } from "@/lib/form-validation";
import { cn } from "@/lib/utils";
import type { FormField, HrmsRow } from "@/types/hrms";

type OnboardingModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  submitLabel?: string;
  initialValues?: HrmsRow;
  onSubmit: (values: HrmsRow) => void | Promise<void>;
};

function resolveFields(sections: typeof ONBOARDING_FORM_SECTIONS): FormField[] {
  return sections.flatMap((section) => section.fields);
}

function findSectionIdForField(sections: typeof ONBOARDING_FORM_SECTIONS, fieldName: string): string | undefined {
  return sections.find((section) => section.fields.some((field) => field.name === fieldName))?.id;
}

export function OnboardingModal({
  open,
  onClose,
  title,
  subtitle,
  submitLabel = "Save & Continue",
  initialValues,
  onSubmit,
}: OnboardingModalProps) {
  const sections = ONBOARDING_FORM_SECTIONS;
  const resolvedFields = useMemo(() => resolveFields(sections), [sections]);
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
    setOpenSectionId(sections[0]?.id ?? null);
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
      id: initialValues?.id ?? `on-${Date.now()}`,
    };

    resolvedFields.forEach((field) => {
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

  const checklistValues = useMemo(
    () => ({ ...(initialValues ?? {}), ...values }) as HrmsRow,
    [initialValues, values],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateFormFields(resolvedFields, values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const firstErrorField = Object.keys(nextErrors)[0];
      const sectionId = findSectionIdForField(sections, firstErrorField);
      if (sectionId) setOpenSectionId(sectionId);
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

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      subtitle={
        subtitle ??
        (title.toLowerCase().startsWith("edit")
          ? "Continue the onboarding checklist for this employee."
          : "Start onboarding and complete each checklist step.")
      }
      size="xl"
      footer={
        <>
          <button
            type="submit"
            form="onboarding-form"
            className="btn btn-primary"
            disabled={submitting}
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
      <form id="onboarding-form" className="master-data-form" onSubmit={handleSubmit} noValidate>
        {submitError ? (
          <p className="form-field-error form-span-full" role="alert">
            {submitError}
          </p>
        ) : null}

        <div className="onboarding-modal-layout">
          <aside className="onboarding-modal-sidebar">
            <OnboardingChecklist
              values={checklistValues}
              activeStepId={openSectionId}
              onStepSelect={setOpenSectionId}
            />
          </aside>

          <div className="onboarding-modal-content">
            <div className="form-sections">
              {sections.map((section, index) => {
                const isOpen = openSectionId === section.id;

                return (
                  <section key={section.id} className={cn("form-section", isOpen && "is-open")}>
                    <button
                      type="button"
                      className="form-section-header"
                      aria-expanded={isOpen}
                      aria-controls={`onboarding-section-panel-${section.id}`}
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
                        id={`onboarding-section-panel-${section.id}`}
                        className="form-grid form-grid-2 form-section-fields"
                      >
                        <FormFieldsRenderer
                          fields={section.fields}
                          values={values}
                          errors={errors}
                          onChange={handleFieldChange}
                        />
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
