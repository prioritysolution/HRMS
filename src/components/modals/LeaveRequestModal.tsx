"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import {
  buildInitialFormValues,
  FormFieldsRenderer,
} from "@/components/ui/FormFieldsRenderer";
import { validateFormField, validateFormFields, type FormValue } from "@/lib/form-validation";
import type { FormField } from "@/types/hrms";
import { useI18n, translateHrmsLookup } from "@/i18n";

type LeaveRequestModalProps = {
  open: boolean;
  onClose: () => void;
};

const leaveFields: FormField[] = [
  { name: "leaveEmpId", label: "Employee ID", required: true },
  { name: "leaveEmpName", label: "Employee Name", required: true },
  { name: "leaveJob", label: "Job Title" },
  {
    name: "leaveType",
    label: "Leave Type",
    type: "select",
    options: ["Sick Leave", "Annual Leave", "Personal Leave"],
    required: true,
  },
  { name: "startDate", label: "Starting Date", type: "date", required: true },
  { name: "endDate", label: "Ending Date", type: "date", required: true },
  { name: "reason", label: "Reason for leave", type: "textarea", span: "full", required: true },
];

export function LeaveRequestModal({ open, onClose }: LeaveRequestModalProps) {
  const { t, language } = useI18n();
  const [values, setValues] = useState<Record<string, FormValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [leaveDuration, setLeaveDuration] = useState("Full Day");

  useEffect(() => {
    if (!open) {
      setErrors({});
      return;
    }
    setValues(buildInitialFormValues(leaveFields));
    setLeaveDuration("Full Day");
    setErrors({});
  }, [open]);

  const handleFieldChange = (name: string, value: FormValue) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    const field = leaveFields.find((item) => item.name === name);
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
    const nextErrors = validateFormFields(leaveFields, values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    onClose();
  };

  const durationOptions = [
    { value: "Full Day", label: translateHrmsLookup(language, "labels", "Full Day") },
    { value: "First Half", label: translateHrmsLookup(language, "labels", "First Half") },
    { value: "Second Half", label: translateHrmsLookup(language, "labels", "Second Half") },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={translateHrmsLookup(language, "titles", "Leave Requisition")}
      subtitle={translateHrmsLookup(language, "labels", "Fill out the form to submit leave request")}
      size="lg"
      footer={
        <>
          <button type="submit" form="leave-request-form" className="btn btn-primary">
            {translateHrmsLookup(language, "actions", "Apply Leave")}
          </button>
          <button type="button" className="btn btn-outline-danger" onClick={onClose}>
            {t("common.cancel")}
          </button>
        </>
      }
    >
      <form id="leave-request-form" className="form-grid form-grid-2" onSubmit={handleSubmit} noValidate>
        <FormFieldsRenderer
          fields={leaveFields}
          values={values}
          errors={errors}
          onChange={handleFieldChange}
        />
        <div className="form-span-full rounded-xl border border-[var(--border)] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h6 className="m-0 font-semibold">
              {translateHrmsLookup(language, "labels", "Leave Duration")}
            </h6>
            <SearchableSelect
              value={leaveDuration}
              onChange={setLeaveDuration}
              placeholder={translateHrmsLookup(language, "labels", "Select duration")}
              searchPlaceholder={translateHrmsLookup(language, "labels", "Search duration...")}
              className="max-w-[180px]"
              options={durationOptions}
            />
          </div>
          <div className="flex justify-between font-semibold">
            <span>{translateHrmsLookup(language, "labels", "Total")}</span>
            <span>1 {translateHrmsLookup(language, "labels", "Day(s)")}</span>
          </div>
        </div>
        <div className="form-span-full">
          <label className="check-label">
            <input type="checkbox" defaultChecked />{" "}
            {translateHrmsLookup(language, "labels", "Notify Reporting Manager")}
          </label>
        </div>
      </form>
    </Modal>
  );
}

