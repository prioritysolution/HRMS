"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import {
  buildInitialFormValues,
  FormFieldsRenderer,
} from "@/components/ui/FormFieldsRenderer";
import { validateFormField, validateFormFields } from "@/lib/form-validation";
import type { FormField } from "@/types/hrms";

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
  const [values, setValues] = useState<Record<string, string | boolean>>({});
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

  const handleFieldChange = (name: string, value: string | boolean) => {
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Leave Request"
      subtitle="Fill out the form to submit leave request"
      size="lg"
      footer={
        <>
          <button type="submit" form="leave-request-form" className="btn btn-primary">
            Apply Leave
          </button>
          <button type="button" className="btn btn-outline-danger" onClick={onClose}>
            Cancel
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
            <h6 className="m-0 font-semibold">Leave Duration</h6>
            <SearchableSelect
              value={leaveDuration}
              onChange={setLeaveDuration}
              placeholder="Select duration"
              searchPlaceholder="Search duration..."
              className="max-w-[180px]"
              options={["Full Day", "First Half", "Second Half"]}
            />
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>1 Day(s)</span>
          </div>
        </div>
        <div className="form-span-full">
          <label className="check-label">
            <input type="checkbox" defaultChecked /> Notify Reporting Manager
          </label>
        </div>
      </form>
    </Modal>
  );
}
