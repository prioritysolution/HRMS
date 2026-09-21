"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useI18n } from "@/i18n";
import {
  applOptionService,
} from "@/lib/api";
import type { ApplOptionRecord } from "@/lib/api/types";
import {
  OT_CALCULATION_OPT_GRP_ID,
  attendanceSettingsService,
  type AttendanceSettings,
} from "@/lib/api/services/attendance-settings.service";
import { validateFormField, validateFormFields, type FormValue } from "@/lib/form-validation";
import type { FormField } from "@/types/hrms";

type OtCalculationOption = {
  value: string;
  label: string;
  optionId: string;
};

/**
 * OT Calculation select value = Opt_Code (what the API expects on save).
 * optionId is kept only to resolve GET responses that return Option_Id.
 */
function otCalculationToSelectOptions(records: ApplOptionRecord[]): OtCalculationOption[] {
  return [...records]
    .sort((left, right) => Number(left.Srl_No ?? 0) - Number(right.Srl_No ?? 0))
    .map((record) => ({
      value: String(record.Opt_Code ?? "").trim(),
      label: String(record.Opt_Description || record.Opt_Code || "").trim(),
      optionId: String(record.Option_Id ?? "").trim(),
    }))
    .filter((option) => option.value);
}

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

function buildOvertimeValueFields(
  otCalculationOptions: OtCalculationOption[],
): FormField[] {
  return [
    {
      label: "OT Calculation",
      name: "ot_calculation",
      type: "select",
      required: true,
      defaultValue: otCalculationOptions[0]?.value ?? "",
      options: otCalculationOptions,
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
}

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

function resolveOtCalculationValue(
  raw: string,
  name: string | undefined,
  options: OtCalculationOption[],
): string {
  const text = String(raw ?? "").trim();
  const label = String(name ?? "").trim();

  if (text) {
    const byCode = options.find(
      (option) => option.value.toLowerCase() === text.toLowerCase(),
    );
    if (byCode) return byCode.value;

    const byId = options.find((option) => option.optionId === text);
    if (byId) return byId.value;
  }

  if (label) {
    const byLabel = options.find(
      (option) => option.label.toLowerCase() === label.toLowerCase(),
    );
    if (byLabel) return byLabel.value;
  }

  return options[0]?.value ?? "";
}

function toFormValues(
  data: AttendanceSettings,
  otCalculationOptions: OtCalculationOption[],
): Record<string, FormValue> {
  return {
    late_grace_period_minutes: String(data.late_grace_period_minutes),
    early_leaving_grace_minutes: String(data.early_leaving_grace_minutes),
    late_mark_after_minutes: String(data.late_mark_after_minutes),
    half_day_after_minutes: String(data.half_day_after_minutes),
    absent_after_minutes: String(data.absent_after_minutes),
    overtime_applicable: String(data.overtime_applicable),
    ot_calculation: resolveOtCalculationValue(
      data.ot_calculation,
      data.ot_calculation_name,
      otCalculationOptions,
    ),
    minimum_ot_minutes: String(data.minimum_ot_minutes),
    ot_round_off_minutes: String(data.ot_round_off_minutes),
    ot_requires_approval: String(data.ot_requires_approval),
    maximum_ot_per_day_hours: String(data.maximum_ot_per_day_hours),
    holiday_ot: String(data.holiday_ot),
    weekly_off_ot: String(data.weekly_off_ot),
  };
}

/** Merge API/toggle values with form field defaults (toggles are not FormFields). */
function buildAttendanceFormValues(
  data: AttendanceSettings,
  otCalculationOptions: OtCalculationOption[],
): Record<string, FormValue> {
  const fields = [
    ...lateEarlyFields,
    ...buildOvertimeValueFields(otCalculationOptions),
  ];
  return {
    ...buildInitialFormValues(fields),
    ...toFormValues(data, otCalculationOptions),
  };
}

function translateFields(
  fields: FormField[],
  t: (key: string) => string,
  prefix: string,
): FormField[] {
  return fields.map((field) => ({
    ...field,
    label: t(`${prefix}.${field.name}`),
  }));
}

export default function AttendanceSettingsPage() {
  const { t } = useI18n();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [otCalculationOptions, setOtCalculationOptions] = useState<
    OtCalculationOption[]
  >([]);
  const overtimeValueFields = useMemo(
    () =>
      translateFields(
        buildOvertimeValueFields(otCalculationOptions),
        t,
        "settings.attendance.fields",
      ),
    [otCalculationOptions, t],
  );
  const lateEarlyTranslated = useMemo(
    () => translateFields(lateEarlyFields, t, "settings.attendance.fields"),
    [t],
  );
  const allFields = useMemo(
    () => [...lateEarlyTranslated, ...overtimeValueFields],
    [lateEarlyTranslated, overtimeValueFields],
  );
  const [values, setValues] = useState<Record<string, FormValue>>(() => ({
    ...buildInitialFormValues([...lateEarlyFields, ...buildOvertimeValueFields([])]),
    overtime_applicable: "0",
    ot_requires_approval: "0",
    holiday_ot: "0",
    weekly_off_ot: "0",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const [result, otCalcOpts] = await Promise.all([
          attendanceSettingsService.get(),
          applOptionService.list({
            opt_grp_id: OT_CALCULATION_OPT_GRP_ID,
            is_active: 1,
          }),
        ]);
        if (cancelled) return;

        const mappedOtCalc = otCalculationToSelectOptions(otCalcOpts);
        setOtCalculationOptions(mappedOtCalc);

        if (result.data) {
          setValues(buildAttendanceFormValues(result.data, mappedOtCalc));
          setErrors({});
        }
        if (!result.ok) {
          toast.error({
            title: t("settings.common.loadFailed"),
            message: result.message,
          });
        }
      } catch (error) {
        if (cancelled) return;
        toast.error({
          title: t("settings.common.loadFailed"),
          message:
            error instanceof Error
              ? error.message
              : t("settings.attendance.loadError"),
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSettings();
    return () => {
      cancelled = true;
    };
  }, [toast, t]);

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
        title: t("settings.common.validationError"),
        message: t("settings.attendance.validationMessage"),
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
        ot_calculation: String(values.ot_calculation ?? "").trim(),
        minimum_ot_minutes: toNumber(values.minimum_ot_minutes),
        ot_round_off_minutes: toNumber(values.ot_round_off_minutes),
        ot_requires_approval: toFlag(values.ot_requires_approval),
        maximum_ot_per_day_hours: toNumber(values.maximum_ot_per_day_hours),
        holiday_ot: toFlag(values.holiday_ot),
        weekly_off_ot: toFlag(values.weekly_off_ot),
      });
      if (!result.ok || !result.data) {
        toast.error({ title: t("settings.common.saveFailed"), message: result.message });
        return;
      }
      setValues(buildAttendanceFormValues(result.data, otCalculationOptions));
      toast.success({ title: t("settings.common.saved"), message: result.message });
    } catch {
      toast.error({
        title: t("settings.common.saveFailed"),
        message: t("settings.attendance.saveError"),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t("settings.attendance.title")}
        section={t("settings.common.section")}
        hideTitle
      />
      {loading ? (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <TableSectionHeader title={t("settings.attendance.title")} />
              <div className="employee-profile-loading">
                <RoundLoader />
                <p>{t("settings.attendance.loading")}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <form id="attendance-settings-form" onSubmit={(event) => void handleSave(event)} noValidate>
                <TableSectionHeader title={t("settings.attendance.lateEarlyTitle")} />
                <div className="form-grid form-grid-2">
                  <FormFieldsRenderer
                    fields={lateEarlyTranslated}
                    values={values}
                    errors={errors}
                    onChange={handleChange}
                  />
                </div>

                <div className="email-config-test-block">
                  <TableSectionHeader title={t("settings.attendance.overtimeTitle")} />

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
                              <h6>{t(`settings.attendance.toggles.${option.name}.label`)}</h6>
                              <p>{t(`settings.attendance.toggles.${option.name}.description`)}</p>
                            </div>
                          </div>
                          <StatusToggle
                            name={option.name}
                            value={String(values[option.name] ?? "0")}
                            activeLabel={t("common.yes")}
                            inactiveLabel={t("common.no")}
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
                    {saving ? t("settings.common.saving") : t("settings.common.saveSettings")}
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
