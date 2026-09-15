"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  Building2,
  CalendarDays,
  FileText,
  Landmark,
  MinusCircle,
  PenLine,
  PlusCircle,
  Timer,
  UserRound,
} from "lucide-react";
import { FormFieldsRenderer, buildInitialFormValues } from "@/components/ui/FormFieldsRenderer";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoundLoader } from "@/components/ui/RoundLoader";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { TableSectionHeader } from "@/components/ui/TableSectionHeader";
import { useToast } from "@/components/ui/ToastProvider";
import type { PayrollSettings } from "@/data/settings-mock";
import { payrollSettingsService } from "@/lib/api/services/payroll-settings.service";
import { validateFormField, validateFormFields, type FormValue } from "@/lib/form-validation";
import type { FormField } from "@/types/hrms";

const salaryCalculationFields: FormField[] = [
  {
    label: "Salary Basis",
    name: "salary_basis",
    type: "select",
    required: true,
    defaultValue: "monthly",
    options: [
      { value: "monthly", label: "Monthly" },
      { value: "daily", label: "Daily" },
      { value: "hourly", label: "Hourly" },
    ],
  },
  {
    label: "Working Days Basis",
    name: "working_days_basis",
    type: "select",
    required: true,
    defaultValue: "calendar_days",
    options: [
      { value: "calendar_days", label: "Calendar Days" },
      { value: "actual_working_days", label: "Actual Working Days" },
      { value: "fixed_26", label: "Fixed 26 Days" },
      { value: "fixed_30", label: "Fixed 30 Days" },
    ],
  },
  {
    label: "Salary Calculation Based On",
    name: "salary_calculation_based_on",
    type: "select",
    required: true,
    defaultValue: "attendance",
    options: [
      { value: "attendance", label: "Attendance" },
      { value: "paid_days", label: "Paid Days" },
      { value: "working_days", label: "Working Days" },
    ],
  },
];

const overtimeValueFields: FormField[] = [
  {
    label: "OT Calculation Based On",
    name: "ot_calculation_based_on",
    type: "select",
    required: true,
    defaultValue: "basic",
    options: [
      { value: "basic", label: "Basic" },
      { value: "hourly_rate", label: "Hourly Rate" },
    ],
  },
  {
    label: "Normal Day OT Rate (×)",
    name: "normal_day_ot_rate",
    type: "number",
    required: true,
    min: 0,
    max: 10,
    defaultValue: "1.5",
  },
  {
    label: "Weekly Off OT Rate (×)",
    name: "weekly_off_ot_rate",
    type: "number",
    required: true,
    min: 0,
    max: 10,
    defaultValue: "2",
  },
  {
    label: "Holiday OT Rate (×)",
    name: "holiday_ot_rate",
    type: "number",
    required: true,
    min: 0,
    max: 10,
    defaultValue: "2",
  },
  {
    label: "Minimum OT (Minutes)",
    name: "minimum_ot_minutes",
    type: "number",
    required: true,
    min: 0,
    max: 480,
    defaultValue: "30",
  },
];

const slipFormatField: FormField[] = [
  {
    label: "Salary Slip Format",
    name: "salary_slip_format",
    type: "select",
    required: true,
    defaultValue: "a4",
    options: [
      { value: "a4", label: "A4" },
      { value: "a5", label: "A5" },
      { value: "letter", label: "Letter" },
    ],
  },
];

const allFields: FormField[] = [
  ...salaryCalculationFields,
  ...overtimeValueFields,
  ...slipFormatField,
];

const SLIP_TOGGLES = [
  {
    name: "generate_salary_slip_automatically" as const,
    label: "Generate Salary Slip Automatically",
    description: "Create salary slips automatically after payroll processing.",
    icon: FileText,
  },
  {
    name: "show_attendance_details" as const,
    label: "Show Attendance Details",
    description: "Include attendance summary on the salary slip.",
    icon: CalendarDays,
  },
  {
    name: "show_leave_details" as const,
    label: "Show Leave Details",
    description: "Include leave summary on the salary slip.",
    icon: UserRound,
  },
  {
    name: "show_earnings" as const,
    label: "Show Earnings",
    description: "Display earnings breakup on the salary slip.",
    icon: PlusCircle,
  },
  {
    name: "show_deductions" as const,
    label: "Show Deductions",
    description: "Display deductions breakup on the salary slip.",
    icon: MinusCircle,
  },
  {
    name: "show_employer_contributions" as const,
    label: "Show Employer Contributions",
    description: "Include employer contribution details on the slip.",
    icon: Building2,
  },
  {
    name: "show_bank_details" as const,
    label: "Show Bank Details",
    description: "Show employee bank account details on the slip.",
    icon: Landmark,
  },
  {
    name: "digital_signature" as const,
    label: "Digital Signature",
    description: "Print digital signature on generated salary slips.",
    icon: PenLine,
  },
] as const;

function toFlag(value: FormValue): 0 | 1 {
  return String(value ?? "").trim() === "0" ? 0 : 1;
}

function toNumber(value: FormValue, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toFormValues(data: PayrollSettings): Record<string, FormValue> {
  return {
    salary_basis: data.salary_basis,
    working_days_basis: data.working_days_basis,
    salary_calculation_based_on: data.salary_calculation_based_on,
    ot_applicable: String(data.ot_applicable),
    ot_calculation_based_on: data.ot_calculation_based_on,
    normal_day_ot_rate: String(data.normal_day_ot_rate),
    weekly_off_ot_rate: String(data.weekly_off_ot_rate),
    holiday_ot_rate: String(data.holiday_ot_rate),
    minimum_ot_minutes: String(data.minimum_ot_minutes),
    generate_salary_slip_automatically: String(data.generate_salary_slip_automatically),
    salary_slip_format: data.salary_slip_format,
    show_attendance_details: String(data.show_attendance_details),
    show_leave_details: String(data.show_leave_details),
    show_earnings: String(data.show_earnings),
    show_deductions: String(data.show_deductions),
    show_employer_contributions: String(data.show_employer_contributions),
    show_bank_details: String(data.show_bank_details),
    digital_signature: String(data.digital_signature),
  };
}

export default function PayrollSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, FormValue>>(() =>
    buildInitialFormValues(allFields, {
      ot_applicable: "1",
      generate_salary_slip_automatically: "1",
      show_attendance_details: "1",
      show_leave_details: "1",
      show_earnings: "1",
      show_deductions: "1",
      show_employer_contributions: "1",
      show_bank_details: "1",
      digital_signature: "1",
    }),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const result = await payrollSettingsService.get();
        if (cancelled) return;
        if (result.data) {
          setValues(buildInitialFormValues(allFields, toFormValues(result.data)));
          setErrors({});
        }
        if (!result.ok) {
          toast.error({
            title: "Unable to load settings",
            message: result.message,
          });
        }
      } catch {
        if (cancelled) return;
        toast.error({
          title: "Unable to load settings",
          message: "Failed to load payroll settings. Please try again.",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSettings();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const handleChange = (name: string, value: FormValue) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    const field = allFields.find((item) => item.name === name);
    if (!field) return;
    setErrors((prev) => {
      const next = { ...prev };
      const error = validateFormField(field, value);
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateFormFields(allFields, values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error({
        title: "Validation error",
        message: "Please fill all mandatory payroll settings.",
      });
      return;
    }

    setSaving(true);
    try {
      const result = await payrollSettingsService.update({
        salary_basis:
          String(values.salary_basis) === "daily"
            ? "daily"
            : String(values.salary_basis) === "hourly"
              ? "hourly"
              : "monthly",
        working_days_basis:
          String(values.working_days_basis) === "actual_working_days"
            ? "actual_working_days"
            : String(values.working_days_basis) === "fixed_26"
              ? "fixed_26"
              : String(values.working_days_basis) === "fixed_30"
                ? "fixed_30"
                : "calendar_days",
        salary_calculation_based_on:
          String(values.salary_calculation_based_on) === "paid_days"
            ? "paid_days"
            : String(values.salary_calculation_based_on) === "working_days"
              ? "working_days"
              : "attendance",
        ot_applicable: toFlag(values.ot_applicable),
        ot_calculation_based_on:
          String(values.ot_calculation_based_on) === "hourly_rate" ? "hourly_rate" : "basic",
        normal_day_ot_rate: toNumber(values.normal_day_ot_rate, 1.5),
        weekly_off_ot_rate: toNumber(values.weekly_off_ot_rate, 2),
        holiday_ot_rate: toNumber(values.holiday_ot_rate, 2),
        minimum_ot_minutes: toNumber(values.minimum_ot_minutes, 30),
        generate_salary_slip_automatically: toFlag(values.generate_salary_slip_automatically),
        salary_slip_format:
          String(values.salary_slip_format) === "a5"
            ? "a5"
            : String(values.salary_slip_format) === "letter"
              ? "letter"
              : "a4",
        show_attendance_details: toFlag(values.show_attendance_details),
        show_leave_details: toFlag(values.show_leave_details),
        show_earnings: toFlag(values.show_earnings),
        show_deductions: toFlag(values.show_deductions),
        show_employer_contributions: toFlag(values.show_employer_contributions),
        show_bank_details: toFlag(values.show_bank_details),
        digital_signature: toFlag(values.digital_signature),
      });
      if (!result.ok || !result.data) {
        toast.error({ title: "Save failed", message: result.message });
        return;
      }
      setValues(buildInitialFormValues(allFields, toFormValues(result.data)));
      toast.success({ title: "Saved", message: result.message });
    } catch {
      toast.error({
        title: "Save failed",
        message: "Failed to save payroll settings. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Payroll Settings" section="Settings" hideTitle />
      {loading ? (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <TableSectionHeader title="Payroll Settings" />
              <div className="employee-profile-loading">
                <RoundLoader />
                <p>Loading payroll settings…</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <form id="payroll-settings-form" onSubmit={(event) => void handleSave(event)} noValidate>
                <TableSectionHeader title="Salary Calculation Settings" />
                <div className="form-grid form-grid-2">
                  <FormFieldsRenderer
                    fields={salaryCalculationFields}
                    values={values}
                    errors={errors}
                    onChange={handleChange}
                  />
                </div>

                <div className="email-config-test-block">
                  <TableSectionHeader title="Overtime Settings" />

                  <div className="notification-option-list">
                    <div className="notification-option">
                      <div className="notification-option-main">
                        <div className="avatar avatar-soft-primary">
                          <Timer size={18} />
                        </div>
                        <div className="notification-option-copy">
                          <h6>OT Applicable</h6>
                          <p>Enable overtime calculation in payroll processing.</p>
                        </div>
                      </div>
                      <StatusToggle
                        name="ot_applicable"
                        value={String(values.ot_applicable ?? "0")}
                        activeLabel="Yes"
                        inactiveLabel="No"
                        onChange={(nextValue) => handleChange("ot_applicable", nextValue)}
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="form-grid form-grid-2 pt-4">
                    <FormFieldsRenderer
                      fields={overtimeValueFields}
                      values={values}
                      errors={errors}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="email-config-test-block">
                  <TableSectionHeader title="Salary Slip Settings" />

                  <div className="form-grid form-grid-2">
                    <FormFieldsRenderer
                      fields={slipFormatField}
                      values={values}
                      errors={errors}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="notification-option-list pt-4">
                    {SLIP_TOGGLES.map((option) => {
                      const Icon = option.icon;
                      return (
                        <div key={option.name} className="notification-option">
                          <div className="notification-option-main">
                            <div className="avatar avatar-soft-primary">
                              <Icon size={18} />
                            </div>
                            <div className="notification-option-copy">
                              <h6>{option.label}</h6>
                              <p>{option.description}</p>
                            </div>
                          </div>
                          <StatusToggle
                            name={option.name}
                            value={String(values[option.name] ?? "0")}
                            activeLabel="Yes"
                            inactiveLabel="No"
                            onChange={(nextValue) => handleChange(option.name, nextValue)}
                            disabled={saving}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button type="submit" className="btn btn-primary inline-flex items-center gap-2" disabled={saving}>
                    <Banknote size={16} />
                    {saving ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
