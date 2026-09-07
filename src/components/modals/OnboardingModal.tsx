"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { Modal } from "@/components/ui/Modal";
import {
  buildInitialFormValues,
  FormFieldsRenderer,
} from "@/components/ui/FormFieldsRenderer";
import { ONBOARDING_FORM_SECTIONS } from "@/config/onboarding-form-sections";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { employeeOnboardingService } from "@/lib/api/services/employee-onboarding.service";
import { parseDateToIso } from "@/lib/date-utils";
import { validateFormField, validateFormFields, type FormValue } from "@/lib/form-validation";
import {
  collectUniqueConflictRecords,
  getOnboardingUniqueErrors,
  getUniqueFieldError,
  isOnboardingUniqueField,
  type UniqueConflictRecord,
} from "@/lib/onboarding-unique";
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

type SelectOption = { value: string; label: string };

function resolveFields(sections: typeof ONBOARDING_FORM_SECTIONS): FormField[] {
  return sections.flatMap((section) => section.fields);
}

function findSectionIdForField(sections: typeof ONBOARDING_FORM_SECTIONS, fieldName: string): string | undefined {
  return sections.find((section) => section.fields.some((field) => field.name === fieldName))?.id;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asArray(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is Record<string, unknown> => Boolean(asRecord(item)));
  }
  const record = asRecord(payload);
  if (!record) return [];
  for (const key of ["data", "records", "rows", "list"]) {
    const nested = record[key];
    if (Array.isArray(nested)) {
      return nested.filter((item): item is Record<string, unknown> => Boolean(asRecord(item)));
    }
  }
  return [];
}

function firstValue(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function asId(value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  if (Array.isArray(value)) {
    return value.map(asId).filter(Boolean).join(",");
  }
  return String(value).trim();
}

function pickId(record: Record<string, unknown>, keys: string[]): string {
  return asId(firstValue(record, keys));
}

function toIsoDate(value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  const text = String(value).trim();
  const parsed = parseDateToIso(text);
  if (parsed) return parsed;
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? "";
}

function toSelectOptions(
  rows: Record<string, unknown>[],
  valueKeys: string[],
  labelKeys: string[],
): SelectOption[] {
  return rows
    .map((row) => {
      const value = pickId(row, valueKeys);
      if (!value) return null;
      const label = String(firstValue(row, labelKeys) ?? value).trim();
      return { value, label: label || value };
    })
    .filter((option): option is SelectOption => Boolean(option));
}

function toEmployeeOption(emp: Record<string, unknown>): SelectOption | null {
  const id = pickId(emp, ["Employee_id", "employee_id", "id"]);
  if (!id) return null;
  const code = String(firstValue(emp, ["Employee_code", "employee_code"]) ?? id);
  const name = String(
    firstValue(emp, ["Employee_name", "Display_name", "display_name"]) ??
      `${firstValue(emp, ["First_name"]) ?? ""} ${firstValue(emp, ["Last_name"]) ?? ""}`.trim(),
  ).trim();
  return {
    value: id,
    label: name ? `${code} - ${name}` : code,
  };
}

function collectOnboardedEmployeeIds(rows: Array<Record<string, unknown> | HrmsRow>): Set<string> {
  const ids = new Set<string>();
  rows.forEach((row) => {
    const record = row as Record<string, unknown>;
    const id = asId(firstValue(record, ["Employee_id", "employee_id"]));
    if (id) ids.add(id);
  });
  return ids;
}

function eligibleEmployeeOptions(
  employees: Record<string, unknown>[],
  onboardedIds: Set<string>,
  currentEmployeeId = "",
): SelectOption[] {
  return employees
    .map(toEmployeeOption)
    .filter((option): option is SelectOption => {
      if (!option) return false;
      if (currentEmployeeId && option.value === currentEmployeeId) return true;
      return !onboardedIds.has(option.value);
    });
}

function employeeOrgAutofill(
  selected: Record<string, unknown>,
  current: Record<string, FormValue>,
): Record<string, FormValue> {
  const department = pickId(selected, ["Dept_Id", "dept_id"]);
  const designation = pickId(selected, ["Desig_Id", "desig_id"]);
  const employmentType = pickId(selected, ["Emp_type_id", "emp_type_id"]);
  const branch = pickId(selected, ["Branch_Id", "branch_id"]);
  const grade = pickId(selected, ["Grade_Id", "grade_id"]);
  const shift = pickId(selected, ["Shift_ids", "Shift_id", "Shift_Id", "shift_id"]);
  const employmentStatus = pickId(selected, [
    "Employment_status",
    "Emp_status_id",
    "Employment_status_id",
  ]);
  const deviceUserId = pickId(selected, ["Device_user_id", "device_user_id"]);
  const joiningDate = toIsoDate(firstValue(selected, ["Date_of_joining", "date_of_joining"]));
  const workEmail = String(
    firstValue(selected, ["Work_Email", "Work_email", "Email", "email"]) ?? "",
  ).trim();
  const username = String(firstValue(selected, ["User_Name", "Username", "username"]) ?? "").trim();

  return {
    Date_of_joining: joiningDate || current.Date_of_joining,
    Device_user_id: deviceUserId || current.Device_user_id,
    Department: department || current.Department,
    Designation: designation || current.Designation,
    Employment_type: employmentType || current.Employment_type,
    Branch: branch || current.Branch,
    Grade: grade || current.Grade,
    Shift: shift || current.Shift,
    Employment_status: employmentStatus || current.Employment_status,
    Work_email: workEmail || current.Work_email,
    Username: username || current.Username,
  };
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

  const [employees, setEmployees] = useState<Record<string, unknown>[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<SelectOption[]>([]);
  const [deptOptions, setDeptOptions] = useState<SelectOption[]>([]);
  const [desigOptions, setDesigOptions] = useState<SelectOption[]>([]);
  const [empTypeOptions, setEmpTypeOptions] = useState<SelectOption[]>([]);
  const [branchOptions, setBranchOptions] = useState<SelectOption[]>([]);
  const [gradeOptions, setGradeOptions] = useState<SelectOption[]>([]);
  const [shiftOptions, setShiftOptions] = useState<SelectOption[]>([]);
  const [statusOptions, setStatusOptions] = useState<SelectOption[]>([]);
  const uniqueRecordsRef = useRef<UniqueConflictRecord[]>([]);
  const uniqueTimersRef = useRef<Partial<Record<string, ReturnType<typeof setTimeout>>>>({});
  const isEditMode = Boolean(String(initialValues?.Onboard_id ?? initialValues?.id ?? "").trim());

  useEffect(() => {
    if (!open) {
      setErrors({});
      setSubmitError("");
      setSubmitting(false);
      setOpenSectionId(null);
      setEmployees([]);
      setEmployeeOptions([]);
      uniqueRecordsRef.current = [];
      Object.values(uniqueTimersRef.current).forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
      uniqueTimersRef.current = {};
      return;
    }

    void Promise.all([
      apiClient.get<unknown>(`${API_ENDPOINTS.employee.list}?status=1`).catch(() => []),
      apiClient.get<unknown>(API_ENDPOINTS.employee.list).catch(() => []),
      employeeOnboardingService.list().catch(() => [] as HrmsRow[]),
    ]).then(([activeEmployeesPayload, allEmployeesPayload, onboardingRows]) => {
      const rows = asArray(activeEmployeesPayload);
      setEmployees(rows);
      uniqueRecordsRef.current = collectUniqueConflictRecords([
        ...asArray(allEmployeesPayload),
        ...onboardingRows,
      ]);

      const currentEmployeeId = String(initialValues?.Employee_id ?? "").trim();
      const options = eligibleEmployeeOptions(
        rows,
        collectOnboardedEmployeeIds(onboardingRows),
        currentEmployeeId,
      );

      if (
        currentEmployeeId &&
        !options.some((option) => option.value === currentEmployeeId)
      ) {
        const code = String(initialValues?.Employee_code ?? currentEmployeeId);
        const name = String(initialValues?.Display_name ?? "").trim();
        options.unshift({
          value: currentEmployeeId,
          label: name ? `${code} - ${name}` : code,
        });
      }

      setEmployeeOptions(options);
    });

    void apiClient
      .get<unknown>(API_ENDPOINTS.department.list)
      .then((res) => setDeptOptions(toSelectOptions(asArray(res), ["Dept_Id", "id"], ["Dept_Name", "name"])))
      .catch(console.error);

    void apiClient
      .get<unknown>(API_ENDPOINTS.designation.list)
      .then((res) => setDesigOptions(toSelectOptions(asArray(res), ["Desig_Id", "id"], ["Desig_Name", "name"])))
      .catch(console.error);

    void apiClient
      .get<unknown>(API_ENDPOINTS.employmentType.list)
      .then((res) =>
        setEmpTypeOptions(
          toSelectOptions(asArray(res), ["Emp_type_id", "id"], ["Type_name", "Emp_type_name", "name"]),
        ),
      )
      .catch(console.error);

    void apiClient
      .get<unknown>(API_ENDPOINTS.branch.list)
      .then((res) =>
        setBranchOptions(toSelectOptions(asArray(res), ["Branch_Id", "id"], ["Branch_Name", "name"])),
      )
      .catch(console.error);

    void apiClient
      .get<unknown>(API_ENDPOINTS.grade.list)
      .then((res) => setGradeOptions(toSelectOptions(asArray(res), ["Grade_Id", "id"], ["Grade_Name", "name"])))
      .catch(console.error);

    void apiClient
      .get<unknown>(API_ENDPOINTS.workShift.list)
      .then((res) =>
        setShiftOptions(
          toSelectOptions(asArray(res), ["Shift_Id", "Shift_id", "id"], ["Shift_name", "Shift_Name", "name"]),
        ),
      )
      .catch(console.error);

    void apiClient
      .get<unknown>(API_ENDPOINTS.employmentStatus.list)
      .then((res) =>
        setStatusOptions(
          toSelectOptions(
            asArray(res),
            ["Emp_status_id", "Employment_status_id", "id"],
            ["Status_name", "Employment_status_name", "name"],
          ),
        ),
      )
      .catch(console.error);

    setValues(buildInitialFormValues(resolvedFields, initialValues));
    setErrors({});
    setSubmitError("");
    setOpenSectionId(sections[0]?.id ?? null);
  }, [open, resolvedFields, initialValues?.id, initialValues?.Onboard_id, initialValues?.Employee_id, sections]);

  const dynamicSections = useMemo(() => {
    return sections.map((section) => ({
      ...section,
      fields: section.fields.map((field) => {
        if (field.name === "Employee_id") return { ...field, options: employeeOptions };

        const getFallbackOptions = (idKey: string, nameKey: string, val: FormValue) => {
          if (!val) return [];
          const fromEmp = employees.find((employee) => String(employee[idKey] ?? "") === String(val));
          if (fromEmp && fromEmp[nameKey]) return [{ value: String(val), label: String(fromEmp[nameKey]) }];
          if (initialValues && String(initialValues[idKey] ?? "") === String(val) && initialValues[nameKey]) {
            return [{ value: String(val), label: String(initialValues[nameKey]) }];
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
          let fallback: SelectOption[] = [];
          if (shiftOptions.length === 0 && values.Shift) {
            const shiftVals = String(values.Shift).split(",").map((item) => item.trim()).filter(Boolean);
            if (initialValues?.Shift_names) {
              const names = String(initialValues.Shift_names).split(",").map((item) => item.trim());
              fallback = shiftVals.map((value, index) => ({ value, label: names[index] || value }));
            } else {
              fallback = shiftVals.map((value) => ({ value, label: value }));
            }
          }
          return { ...field, options: shiftOptions.length > 0 ? shiftOptions : fallback };
        }
        if (field.name === "Employment_status") {
          const fallback = statusOptions.length === 0
            ? getFallbackOptions("Employment_status", "Employment_status_name", values.Employment_status)
            : [];
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

  const getUniqueExclude = (nextValues?: Record<string, FormValue>) => ({
    employeeId: String((nextValues ?? values).Employee_id ?? ""),
    onboardId: String(initialValues?.Onboard_id ?? initialValues?.id ?? ""),
  });

  const applyUniqueCheck = (
    name: string,
    value: FormValue,
    exclude = getUniqueExclude(),
  ) => {
    if (!isOnboardingUniqueField(name)) return;
    const field = resolvedFields.find((item) => item.name === name);
    if (field) {
      const formatError = validateFormField(field, value);
      if (formatError) return;
    }

    const uniqueError = getUniqueFieldError(name, value, uniqueRecordsRef.current, exclude);
    setErrors((prev) => {
      const next = { ...prev };
      if (uniqueError) next[name] = uniqueError;
      else delete next[name];
      return next;
    });
  };

  const scheduleUniqueCheck = (
    name: string,
    value: FormValue,
    exclude = getUniqueExclude(),
  ) => {
    if (!isOnboardingUniqueField(name)) return;
    const existingTimer = uniqueTimersRef.current[name];
    if (existingTimer) clearTimeout(existingTimer);
    uniqueTimersRef.current[name] = setTimeout(() => {
      applyUniqueCheck(name, value, exclude);
    }, 400);
  };

  const handleFieldChange = (name: string, value: FormValue) => {
    let nextValues: Record<string, FormValue> = {};
    setValues((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "Employee_id" && value) {
        const selected = employees.find((employee) => String(employee.Employee_id ?? employee.employee_id ?? "") === String(value));
        if (selected) {
          Object.assign(next, employeeOrgAutofill(selected, next));
        }
      }

      nextValues = next;
      return next;
    });
    const field = resolvedFields.find((item) => item.name === name);
    if (!field) return;

    const formatError = validateFormField(field, value);
    setErrors((prev) => {
      const next = { ...prev };
      if (formatError) next[name] = formatError;
      else delete next[name];
      return next;
    });

    const exclude = {
      employeeId: String((name === "Employee_id" ? value : nextValues.Employee_id) ?? ""),
      onboardId: String(initialValues?.Onboard_id ?? initialValues?.id ?? ""),
    };

    if (!formatError) {
      scheduleUniqueCheck(name, value, exclude);
    }

    if (name === "Employee_id") {
      (["Device_user_id", "Work_email", "Username"] as const).forEach((fieldName) => {
        scheduleUniqueCheck(fieldName, nextValues[fieldName], exclude);
      });
    }
  };

  const handleFieldBlur = (name: string, value: FormValue) => {
    const field = resolvedFields.find((item) => item.name === name);
    if (field) {
      const formatError = validateFormField(field, value);
      if (formatError) return;
    }
    applyUniqueCheck(name, value);
  };

  const buildPayload = (): HrmsRow => {
    const payload: HrmsRow = {
      ...(initialValues ?? {}),
      id: initialValues?.id ?? `on-${Date.now()}`,
    };

    resolvedFields.forEach((field) => {
      if (field.type === "checkbox") {
        const value = values[field.name];
        payload[field.name] =
          value === true || value === "true" || value === 1 || value === "1";
        return;
      }
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
    const uniqueErrors = getOnboardingUniqueErrors(values, uniqueRecordsRef.current, getUniqueExclude());
    const mergedErrors = { ...nextErrors, ...uniqueErrors };
    if (Object.keys(mergedErrors).length > 0) {
      setErrors(mergedErrors);
      const firstErrorField = Object.keys(mergedErrors)[0];
      const sectionId = findSectionIdForField(dynamicSections, firstErrorField);
      if (sectionId) setOpenSectionId(sectionId);
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const [employeePayload, onboardingRows] = await Promise.all([
        apiClient.get<unknown>(API_ENDPOINTS.employee.list).catch(() => []),
        employeeOnboardingService.list().catch(() => [] as HrmsRow[]),
      ]);
      uniqueRecordsRef.current = collectUniqueConflictRecords([
        ...asArray(employeePayload),
        ...onboardingRows,
      ]);

      const selectedEmployeeId = String(values.Employee_id ?? "").trim();
      if (!isEditMode && selectedEmployeeId) {
        const alreadyOnboarded = onboardingRows.some(
          (row) => String(row.Employee_id ?? "").trim() === selectedEmployeeId,
        );
        if (alreadyOnboarded) {
          setErrors((prev) => ({
            ...prev,
            Employee_id: "This employee already has an onboarding record.",
          }));
          setOpenSectionId(sections[0]?.id ?? "registration");
          setSubmitting(false);
          return;
        }
      }
      const latestUniqueErrors = getOnboardingUniqueErrors(
        values,
        uniqueRecordsRef.current,
        getUniqueExclude(),
      );
      if (Object.keys(latestUniqueErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...latestUniqueErrors }));
        const firstErrorField = Object.keys(latestUniqueErrors)[0];
        const sectionId = findSectionIdForField(dynamicSections, firstErrorField);
        if (sectionId) setOpenSectionId(sectionId);
        setSubmitting(false);
        return;
      }

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
                          onBlur={handleFieldBlur}
                          isEdit={isEditMode}
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
