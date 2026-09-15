"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Timer,
} from "lucide-react";
import { FormFieldsRenderer, buildInitialFormValues } from "@/components/ui/FormFieldsRenderer";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoundLoader } from "@/components/ui/RoundLoader";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { TableSectionHeader } from "@/components/ui/TableSectionHeader";
import { useToast } from "@/components/ui/ToastProvider";
import type { AttendanceSettings } from "@/data/settings-mock";
import { attendanceSettingsService } from "@/lib/api/services/attendance-settings.service";
import { validateFormField, validateFormFields, type FormValue } from "@/lib/form-validation";
import type { FormField } from "@/types/hrms";

const lateEarlyFields: FormField[] = [
  {
    label: "Late Grace Period (Minutes)",
    name: "late_grace_period_minutes",
    type: "number",
    required: true,
    min: 0,
    max: 480,
    defaultValue: "15",
  },
  {
    label: "Early Leaving Grace (Minutes)",
    name: "early_leaving_grace_minutes",
    type: "number",
    required: true,
    min: 0,
    max: 480,
    defaultValue: "15",
  },
  {
    label: "Late Mark After (Minutes)",
    name: "late_mark_after_minutes",
    type: "number",
    required: true,
    min: 0,
    max: 480,
    defaultValue: "15",
  },
  {
    label: "Half Day After (Minutes)",
    name: "half_day_after_minutes",
    type: "number",
    required: true,
    min: 0,
    max: 720,
    defaultValue: "120",
  },
  {
    label: "Absent After (Minutes)",
    name: "absent_after_minutes",
    type: "number",
    required: true,
    min: 0,
    max: 1440,
    defaultValue: "240",
  },
];

const overtimeValueFields: FormField[] = [
  {
    label: "OT Calculation",
    name: "ot_calculation",
    type: "select",
    required: true,
    defaultValue: "daily",
    options: [
      { value: "daily", label: "Daily" },
      { value: "monthly", label: "Monthly" },
    ],
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
  {
    label: "OT Round Off (Minutes)",
    name: "ot_round_off_minutes",
    type: "number",
    required: true,
    min: 0,
    max: 480,
    defaultValue: "30",
  },
  {
    label: "Maximum OT per Day (Hours)",
    name: "maximum_ot_per_day_hours",
    type: "number",
    required: true,
    min: 0,
    max: 24,
    defaultValue: "4",
  },
];

const allFields: FormField[] = [...lateEarlyFields, ...overtimeValueFields];

const OT_TOGGLES = [
  {
    name: "overtime_applicable" as const,
    label: "Overtime Applicable",
    description: "Enable overtime tracking and calculation for employees.",
    icon: Timer,
  },
  {
    name: "ot_requires_approval" as const,
    label: "OT Requires Approval",
    description: "Require manager approval before overtime is credited.",
    icon: CheckCircle2,
  },
  {
    name: "holiday_ot" as const,
    label: "Holiday OT",
    description: "Allow overtime on holidays.",
    icon: CalendarDays,
  },
  {
    name: "weekly_off_ot" as const,
    label: "Weekly Off OT",
    description: "Allow overtime on weekly offs.",
    icon: Clock3,
  },
] as const;

function toFlag(value: FormValue): 0 | 1 {
  return String(value ?? "").trim() === "0" ? 0 : 1;
}

function toNumber(value: FormValue, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toFormValues(data: AttendanceSettings): Record<string, FormValue> {
  return {
    late_grace_period_minutes: String(data.late_grace_period_minutes),
    early_leaving_grace_minutes: String(data.early_leaving_grace_minutes),
    late_mark_after_minutes: String(data.late_mark_after_minutes),
    half_day_after_minutes: String(data.half_day_after_minutes),
    absent_after_minutes: String(data.absent_after_minutes),
    overtime_applicable: String(data.overtime_applicable),
    ot_calculation: data.ot_calculation,
    minimum_ot_minutes: String(data.minimum_ot_minutes),
    ot_round_off_minutes: String(data.ot_round_off_minutes),
    ot_requires_approval: String(data.ot_requires_approval),
    maximum_ot_per_day_hours: String(data.maximum_ot_per_day_hours),
    holiday_ot: String(data.holiday_ot),
    weekly_off_ot: String(data.weekly_off_ot),
  };
}

export default function AttendanceSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, FormValue>>(() =>
    buildInitialFormValues(allFields, {
      overtime_applicable: "1",
      ot_requires_approval: "1",
      holiday_ot: "1",
      weekly_off_ot: "1",
    }),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const result = await attendanceSettingsService.get();
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
          message: "Failed to load attendance settings. Please try again.",
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
        message: "Please fill all mandatory attendance settings.",
      });
      return;
    }

    setSaving(true);
    try {
      const result = await attendanceSettingsService.update({
        late_grace_period_minutes: toNumber(values.late_grace_period_minutes),
        early_leaving_grace_minutes: toNumber(values.early_leaving_grace_minutes),
        late_mark_after_minutes: toNumber(values.late_mark_after_minutes),
        half_day_after_minutes: toNumber(values.half_day_after_minutes),
        absent_after_minutes: toNumber(values.absent_after_minutes),
        overtime_applicable: toFlag(values.overtime_applicable),
        ot_calculation: String(values.ot_calculation) === "monthly" ? "monthly" : "daily",
        minimum_ot_minutes: toNumber(values.minimum_ot_minutes),
        ot_round_off_minutes: toNumber(values.ot_round_off_minutes),
        ot_requires_approval: toFlag(values.ot_requires_approval),
        maximum_ot_per_day_hours: toNumber(values.maximum_ot_per_day_hours),
        holiday_ot: toFlag(values.holiday_ot),
        weekly_off_ot: toFlag(values.weekly_off_ot),
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
        message: "Failed to save attendance settings. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Attendance Settings" section="Settings" hideTitle />
      {loading ? (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <TableSectionHeader title="Attendance Settings" />
              <div className="employee-profile-loading">
                <RoundLoader />
                <p>Loading attendance settings…</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <form id="attendance-settings-form" onSubmit={(event) => void handleSave(event)} noValidate>
                <TableSectionHeader title="Late & Early Rules" />
                <div className="form-grid form-grid-2">
                  <FormFieldsRenderer
                    fields={lateEarlyFields}
                    values={values}
                    errors={errors}
                    onChange={handleChange}
                  />
                </div>

                <div className="email-config-test-block">
                  <TableSectionHeader title="Overtime Settings" />

                  <div className="notification-option-list">
                    {OT_TOGGLES.map((option) => {
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

                  <div className="form-grid form-grid-2 pt-4">
                    <FormFieldsRenderer
                      fields={overtimeValueFields}
                      values={values}
                      errors={errors}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
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
