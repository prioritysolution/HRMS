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

  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<{value: string, label: string}[]>([]);
  const [deptOptions, setDeptOptions] = useState<{value: string, label: string}[]>([]);
  const [desigOptions, setDesigOptions] = useState<{value: string, label: string}[]>([]);
  const [empTypeOptions, setEmpTypeOptions] = useState<{value: string, label: string}[]>([]);
  const [branchOptions, setBranchOptions] = useState<{value: string, label: string}[]>([]);
  const [gradeOptions, setGradeOptions] = useState<{value: string, label: string}[]>([]);
  const [shiftOptions, setShiftOptions] = useState<{value: string, label: string}[]>([]);
  const [statusOptions, setStatusOptions] = useState<{value: string, label: string}[]>([]);

  useEffect(() => {
    if (!open) {
      setErrors({});
      setSubmitError("");
      setSubmitting(false);
      setOpenSectionId(null);
      setEmployees([]);
      setEmployeeOptions([]);
      return;
    }
    
    import("@/lib/api/client").then(({ apiClient }) => {
      apiClient.get<any[]>("/api/v1/employee/list?status=1").then((res) => {
        if (Array.isArray(res)) {
          setEmployees(res);
          setEmployeeOptions(
            res.map((emp) => ({
              value: String(emp.Employee_id),
              label: `${emp.Employee_code || emp.Employee_id} - ${emp.Employee_name || emp.First_name || ""} ${emp.Last_name || ""}`.trim(),
            }))
          );
        }
      }).catch(console.error);

      apiClient.get<any[]>("/api/v1/department/list").then((res) => {
        if (Array.isArray(res)) setDeptOptions(res.map(r => ({ value: String(r.Dept_Id || r.id), label: r.Dept_Name || r.name })));
      }).catch(console.error);

      apiClient.get<any[]>("/api/v1/designation/list").then((res) => {
        if (Array.isArray(res)) setDesigOptions(res.map(r => ({ value: String(r.Desig_Id || r.id), label: r.Desig_Name || r.name })));
      }).catch(console.error);

      apiClient.get<any[]>("/api/v1/employment-type/list").then((res) => {
        if (Array.isArray(res)) setEmpTypeOptions(res.map(r => ({ value: String(r.Emp_type_id || r.id), label: r.Type_name || r.Emp_type_name || r.name })));
      }).catch(console.error);

      apiClient.get<any[]>("/api/v1/branch/list").then((res) => {
        if (Array.isArray(res)) setBranchOptions(res.map(r => ({ value: String(r.Branch_Id || r.id), label: r.Branch_Name || r.name })));
      }).catch(console.error);

      apiClient.get<any[]>("/api/v1/grade/list").then((res) => {
        if (Array.isArray(res)) setGradeOptions(res.map(r => ({ value: String(r.Grade_Id || r.id), label: r.Grade_Name || r.name })));
      }).catch(console.error);

      apiClient.get<any[]>("/api/v1/work-shift/list").then((res) => {
        if (Array.isArray(res)) setShiftOptions(res.map(r => ({ value: String(r.Shift_Id || r.id || r.Shift_id), label: r.Shift_name || r.name || r.Shift_Name })));
      }).catch(console.error);

      apiClient.get<any[]>("/api/v1/employment-status/list").then((res) => {
        if (Array.isArray(res)) setStatusOptions(res.map(r => ({ value: String(r.Emp_status_id || r.Employment_status_id || r.id), label: r.Status_name || r.Employment_status_name || r.name })));
      }).catch(console.error);
    });


    setValues(buildInitialFormValues(resolvedFields, initialValues));
    setErrors({});
    setSubmitError("");
    setOpenSectionId(sections[0]?.id ?? null);
  }, [open, resolvedFields, initialValues?.id, sections]);

  const dynamicSections = useMemo(() => {
    return sections.map((section) => ({
      ...section,
      fields: section.fields.map((field) => {
        if (field.name === "Employee_id") return { ...field, options: employeeOptions };
        
        const getFallbackOptions = (idKey: string, nameKey: string, val: any) => {
          if (!val) return [];
          const fromEmp = employees.find(e => String(e[idKey]) === String(val));
          if (fromEmp && fromEmp[nameKey]) return [{ value: String(val), label: fromEmp[nameKey] }];
          if (initialValues && String(initialValues[idKey]) === String(val) && initialValues[nameKey]) {
            return [{ value: String(val), label: initialValues[nameKey] }];
          }
          return [];
        };

        if (field.name === "Department") {
          const fallback = deptOptions.length === 0 ? getFallbackOptions("Dept_Id", "Dept_Name", values.Department) : [];
          return { ...field, options: deptOptions.length > 0 ? deptOptions : fallback };
        }
        if (field.name === "Designation") {
          const fallback = desigOptions.length === 0 ? getFallbackOptions("Desig_Id", "Desig_Name", values.Designation) : [];
          return { ...field, options: desigOptions.length > 0 ? desigOptions : fallback };
        }
        if (field.name === "Employment_type") {
          const fallback = empTypeOptions.length === 0 ? getFallbackOptions("Emp_type_id", "Emp_type_name", values.Employment_type) : [];
          return { ...field, options: empTypeOptions.length > 0 ? empTypeOptions : fallback };
        }
        if (field.name === "Branch") {
          const fallback = branchOptions.length === 0 ? getFallbackOptions("Branch_Id", "Branch_Name", values.Branch) : [];
          return { ...field, options: branchOptions.length > 0 ? branchOptions : fallback };
        }
        if (field.name === "Grade") {
          const fallback = gradeOptions.length === 0 ? getFallbackOptions("Grade_Id", "Grade_Name", values.Grade) : [];
          return { ...field, options: gradeOptions.length > 0 ? gradeOptions : fallback };
        }
        if (field.name === "Shift") {
          let fallback: any[] = [];
          if (shiftOptions.length === 0 && values.Shift) {
             const shiftVals = String(values.Shift).split(",");
             if (initialValues && initialValues.Shift_names) {
                const names = String(initialValues.Shift_names).split(",").map(s => s.trim());
                fallback = shiftVals.map((v, i) => ({ value: v, label: names[i] || v }));
             } else {
                fallback = shiftVals.map(v => ({ value: v, label: v }));
             }
          }
          return { ...field, options: shiftOptions.length > 0 ? shiftOptions : fallback };
        }
        if (field.name === "Employment_status") {
          const fallback = statusOptions.length === 0 ? getFallbackOptions("Employment_status", "Employment_status_name", values.Employment_status) : [];
          return { ...field, options: statusOptions.length > 0 ? statusOptions : fallback };
        }
        return field;
      }),
    }));
  }, [sections, employeeOptions, deptOptions, desigOptions, empTypeOptions, branchOptions, gradeOptions, shiftOptions, statusOptions, values, employees, initialValues]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleFieldChange = (name: string, value: FormValue) => {
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      
      if (name === "Employee_id" && value) {
        const selected = employees.find((e) => String(e.Employee_id) === String(value));
        if (selected) {
          import("@/lib/date-utils").then(({ formatDateDisplay, parseDateToIso }) => {
            setValues((current) => ({
              ...current,
              Date_of_joining: selected.Date_of_joining ? parseDateToIso(selected.Date_of_joining) : current.Date_of_joining,
              Department: selected.Dept_Name || current.Department,
              Designation: selected.Desig_Name || current.Designation,
              Employment_type: selected.Emp_type_name || current.Employment_type,
              Branch: selected.Branch_Id ? String(selected.Branch_Id) : current.Branch, // Snippet didn't have Branch_Name
              Grade: selected.Grade_Name || current.Grade,
              Shift: selected.Shift_names || current.Shift,
              Employment_status: selected.Employment_status_name || current.Employment_status,
              Work_email: selected.Work_Email || selected.Email || current.Work_email,
              Username: selected.User_Name || current.Username,
              Mobile: selected.Mobile || current.Mobile,
            }));
          });
        }
      }
      
      return next;
    });
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
      const sectionId = findSectionIdForField(dynamicSections, firstErrorField);
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
              {dynamicSections.map((section, index) => {
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
