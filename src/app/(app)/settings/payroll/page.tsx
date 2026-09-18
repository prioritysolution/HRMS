"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useI18n, translateHrmsLookup } from "@/i18n";
import { applOptionService, OPT_GRP_IDS } from "@/lib/api/services/appl-options.service";
import type { ApplOptionRecord, CombinedPayrollSettings } from "@/lib/api/types";
import { payrollSettingsService } from "@/lib/api/services/payroll-settings.service";
import { validateFormField, validateFormFields, type FormValue } from "@/lib/form-validation";
import type { FormField } from "@/types/hrms";

type DynamicOption = {
  value: string;
  label: string;
  code: string;
  optionId: string;
};

const DEFAULT_SALARY_BASIS_OPTIONS: DynamicOption[] = [
  { value: "1", label: "Monthly", code: "1", optionId: "110" },
  { value: "2", label: "Daily", code: "2", optionId: "111" },
  { value: "3", label: "Hourly", code: "3", optionId: "112" },
];

const DEFAULT_WORKING_DAYS_OPTIONS: DynamicOption[] = [
  { value: "1", label: "Calendar Days", code: "1", optionId: "98" },
  { value: "2", label: "Actual Working Days", code: "2", optionId: "99" },
  { value: "3", label: "Fixed 26 Days", code: "3", optionId: "100" },
  { value: "4", label: "Fixed 30 Days", code: "4", optionId: "101" },
];

const DEFAULT_SALARY_CALC_OPTIONS: DynamicOption[] = [
  { value: "1", label: "Attendance", code: "1", optionId: "102" },
  { value: "2", label: "Paid Days", code: "2", optionId: "103" },
  { value: "3", label: "Working Days", code: "3", optionId: "104" },
];

const DEFAULT_OT_CALC_OPTIONS: DynamicOption[] = [
  { value: "Basic", label: "Basic", code: "1", optionId: "105" },
  { value: "Hourly Rate", label: "Hourly Rate", code: "2", optionId: "106" },
];

const DEFAULT_SLIP_FORMAT_OPTIONS: DynamicOption[] = [
  { value: "1", label: "A4", code: "1", optionId: "107" },
  { value: "2", label: "A5", code: "2", optionId: "108" },
  { value: "3", label: "Letter", code: "3", optionId: "109" },
];

function toDynamicOptions(
  records: ApplOptionRecord[],
  valueMode: "code" | "description" = "code",
): DynamicOption[] {
  return [...records]
    .sort((a, b) => Number(a.Srl_No ?? 0) - Number(b.Srl_No ?? 0))
    .map((rec) => ({
      value: String(
        valueMode === "description"
          ? rec.Opt_Description || rec.Opt_Code
          : rec.Opt_Code ?? rec.Option_Id,
      ).trim(),
      label: String(rec.Opt_Description || rec.Opt_Code || "").trim(),
      code: String(rec.Opt_Code ?? "").trim(),
      optionId: String(rec.Option_Id ?? "").trim(),
    }))
    .filter((opt) => opt.value && opt.label);
}

function buildSalaryCalculationFields(
  salaryBasisOptions: DynamicOption[],
  workingDaysOptions: DynamicOption[],
  salaryCalcOptions: DynamicOption[],
  t: (key: string) => string,
): FormField[] {
  return [
    {
      label: t("settings.payroll.fields.salary_basis"),
      name: "salary_basis",
      type: "select",
      required: true,
      defaultValue: salaryBasisOptions[0]?.value ?? "1",
      options: salaryBasisOptions,
    },
    {
      label: t("settings.payroll.fields.working_days_basis"),
      name: "working_days_basis",
      type: "select",
      required: true,
      defaultValue: workingDaysOptions[0]?.value ?? "1",
      options: workingDaysOptions,
    },
    {
      label: t("settings.payroll.fields.salary_calculation_based_on"),
      name: "salary_calculation_based_on",
      type: "select",
      required: true,
      defaultValue: salaryCalcOptions[0]?.value ?? "1",
      options: salaryCalcOptions,
    },
  ];
}

function buildOvertimeValueFields(
  otCalculationOptions: DynamicOption[],
  t: (key: string) => string,
): FormField[] {
  return [
    {
      label: t("settings.payroll.fields.ot_calculation_based_on"),
      name: "ot_calculation_based_on",
      type: "select",
      required: true,
      defaultValue: otCalculationOptions[0]?.value ?? "Basic",
      options: otCalculationOptions,
    },
    {
      label: t("settings.payroll.fields.normal_day_ot_rate"),
      name: "normal_day_ot_rate",
      type: "number",
      required: true,
      min: 0,
      max: 10,
      defaultValue: "1.5",
    },
    {
      label: t("settings.payroll.fields.weekly_off_ot_rate"),
      name: "weekly_off_ot_rate",
      type: "number",
      required: true,
      min: 0,
      max: 10,
      defaultValue: "2",
    },
    {
      label: t("settings.payroll.fields.holiday_ot_rate"),
      name: "holiday_ot_rate",
      type: "number",
      required: true,
      min: 0,
      max: 10,
      defaultValue: "2",
    },
    {
      label: t("settings.payroll.fields.minimum_ot_minutes"),
      name: "min_ot_minutes",
      type: "number",
      required: true,
      min: 0,
      max: 480,
      defaultValue: "30",
    },
  ];
}

function buildSlipFormatField(
  slipFormatOptions: DynamicOption[],
  t: (key: string) => string,
): FormField[] {
  return [
    {
      label: t("settings.payroll.fields.salary_slip_format"),
      name: "salary_slip_format",
      type: "select",
      required: true,
      defaultValue: slipFormatOptions[0]?.value ?? "1",
      options: slipFormatOptions,
    },
  ];
}

const SLIP_TOGGLES = [
  {
    name: "generate_automatically" as const,
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

function resolveOptionValue(
  rawCode: unknown,
  rawName: unknown,
  options: DynamicOption[],
  fallbackDefault = "",
): string {
  const code = String(rawCode ?? "").trim().toLowerCase();
  const name = String(rawName ?? "").trim().toLowerCase();

  if (code) {
    const byVal = options.find((o) => o.value.toLowerCase() === code);
    if (byVal) return byVal.value;
    const byCode = options.find((o) => o.code.toLowerCase() === code);
    if (byCode) return byCode.value;
    const byId = options.find((o) => o.optionId.toLowerCase() === code);
    if (byId) return byId.value;
    const byLabel = options.find((o) => o.label.toLowerCase() === code);
    if (byLabel) return byLabel.value;
  }

  if (name) {
    const byName = options.find(
      (o) => o.label.toLowerCase() === name || o.value.toLowerCase() === name,
    );
    if (byName) return byName.value;
  }

  return options[0]?.value ?? fallbackDefault;
}

type OptGroups = {
  salaryBasis: DynamicOption[];
  workingDays: DynamicOption[];
  salaryCalc: DynamicOption[];
  otCalc: DynamicOption[];
  slipFormat: DynamicOption[];
};

function toFormValues(
  data: CombinedPayrollSettings,
  opts: OptGroups,
): Record<string, FormValue> {
  return {
    salary_basis: resolveOptionValue(data.salary_basis, data.salary_basis_name, opts.salaryBasis, "1"),
    working_days_basis: resolveOptionValue(data.working_days_basis, data.working_days_basis_name, opts.workingDays, "1"),
    salary_calculation_based_on: resolveOptionValue(data.salary_calculation_based_on, data.salary_calculation_based_on_name, opts.salaryCalc, "1"),
    ot_applicable: String(data.ot_applicable ?? "0"),
    ot_calculation_based_on: resolveOptionValue(data.ot_calculation_based_on, data.ot_calculation_based_on_name, opts.otCalc, "Basic"),
    normal_day_ot_rate: String(data.normal_day_ot_rate ?? "1.5"),
    weekly_off_ot_rate: String(data.weekly_off_ot_rate ?? "2"),
    holiday_ot_rate: String(data.holiday_ot_rate ?? "2"),
    min_ot_minutes: String(data.min_ot_minutes ?? "30"),
    salary_slip_format: resolveOptionValue(data.salary_slip_format, data.salary_slip_format_name, opts.slipFormat, "1"),
    generate_automatically: String(data.generate_automatically ?? "0"),
    show_attendance_details: String(data.show_attendance_details ?? "0"),
    show_leave_details: String(data.show_leave_details ?? "0"),
    show_earnings: String(data.show_earnings ?? "0"),
    show_deductions: String(data.show_deductions ?? "0"),
    show_employer_contributions: String(data.show_employer_contributions ?? "0"),
    show_bank_details: String(data.show_bank_details ?? "0"),
    digital_signature: String(data.digital_signature ?? "0"),
  };
}

export default function PayrollSettingsPage() {
  const { t, language } = useI18n();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [salaryBasisOptions, setSalaryBasisOptions] = useState<DynamicOption[]>(DEFAULT_SALARY_BASIS_OPTIONS);
  const [workingDaysOptions, setWorkingDaysOptions] = useState<DynamicOption[]>(DEFAULT_WORKING_DAYS_OPTIONS);
  const [salaryCalcOptions, setSalaryCalcOptions] = useState<DynamicOption[]>(DEFAULT_SALARY_CALC_OPTIONS);
  const [otCalcOptions, setOtCalcOptions] = useState<DynamicOption[]>(DEFAULT_OT_CALC_OPTIONS);
  const [slipFormatOptions, setSlipFormatOptions] = useState<DynamicOption[]>(DEFAULT_SLIP_FORMAT_OPTIONS);

  const localizedSalaryBasisOptions = useMemo(
    () =>
      salaryBasisOptions.map((opt) => ({
        ...opt,
        label: translateHrmsLookup(language, "labels", opt.label),
      })),
    [language, salaryBasisOptions],
  );

  const localizedWorkingDaysOptions = useMemo(
    () =>
      workingDaysOptions.map((opt) => ({
        ...opt,
        label: translateHrmsLookup(language, "labels", opt.label),
      })),
    [language, workingDaysOptions],
  );

  const localizedSalaryCalcOptions = useMemo(
    () =>
      salaryCalcOptions.map((opt) => ({
        ...opt,
        label: translateHrmsLookup(language, "labels", opt.label),
      })),
    [language, salaryCalcOptions],
  );

  const localizedOtCalcOptions = useMemo(
    () =>
      otCalcOptions.map((opt) => ({
        ...opt,
        label: translateHrmsLookup(language, "labels", opt.label),
      })),
    [language, otCalcOptions],
  );

  const localizedSlipFormatOptions = useMemo(
    () =>
      slipFormatOptions.map((opt) => ({
        ...opt,
        label: translateHrmsLookup(language, "labels", opt.label),
      })),
    [language, slipFormatOptions],
  );

  const salaryCalculationFields = useMemo(
    () =>
      buildSalaryCalculationFields(
        localizedSalaryBasisOptions,
        localizedWorkingDaysOptions,
        localizedSalaryCalcOptions,
        t,
      ),
    [localizedSalaryBasisOptions, localizedWorkingDaysOptions, localizedSalaryCalcOptions, t],
  );

  const overtimeValueFields = useMemo(
    () => buildOvertimeValueFields(localizedOtCalcOptions, t),
    [localizedOtCalcOptions, t],
  );

  const slipFormatField = useMemo(
    () => buildSlipFormatField(localizedSlipFormatOptions, t),
    [localizedSlipFormatOptions, t],
  );

  const allFields = useMemo(
    () => [...salaryCalculationFields, ...overtimeValueFields, ...slipFormatField],
    [salaryCalculationFields, overtimeValueFields, slipFormatField],
  );

  const [values, setValues] = useState<Record<string, FormValue>>(() => ({
    salary_basis: "1",
    working_days_basis: "1",
    salary_calculation_based_on: "1",
    ot_applicable: "1",
    ot_calculation_based_on: "Basic",
    normal_day_ot_rate: "1.5",
    weekly_off_ot_rate: "2",
    holiday_ot_rate: "2",
    min_ot_minutes: "30",
    salary_slip_format: "1",
    generate_automatically: "1",
    show_attendance_details: "1",
    show_leave_details: "1",
    show_earnings: "1",
    show_deductions: "1",
    show_employer_contributions: "1",
    show_bank_details: "1",
    digital_signature: "1",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const [
          optBasis,
          optWorkingDays,
          optSalaryCalc,
          optOtCalc,
          optSlipFormat,
          settingsResult,
        ] = await Promise.all([
          applOptionService.list({ opt_grp_id: OPT_GRP_IDS.SALARY_BASIS, is_active: 1 }).catch(() => []),
          applOptionService.list({ opt_grp_id: OPT_GRP_IDS.WORKING_DAYS_BASIS, is_active: 1 }).catch(() => []),
          applOptionService.list({ opt_grp_id: OPT_GRP_IDS.SALARY_CALCULATION_BASED_ON, is_active: 1 }).catch(() => []),
          applOptionService.list({ opt_grp_id: OPT_GRP_IDS.OT_CALCULATION, is_active: 1 }).catch(() => []),
          applOptionService.list({ opt_grp_id: OPT_GRP_IDS.SALARY_SLIP_FORMAT, is_active: 1 }).catch(() => []),
          payrollSettingsService.get(),
        ]);

        if (cancelled) return;

        const mappedBasis = optBasis.length
          ? toDynamicOptions(optBasis, "code")
          : DEFAULT_SALARY_BASIS_OPTIONS;
        const mappedWorkingDays = optWorkingDays.length
          ? toDynamicOptions(optWorkingDays, "code")
          : DEFAULT_WORKING_DAYS_OPTIONS;
        const mappedSalaryCalc = optSalaryCalc.length
          ? toDynamicOptions(optSalaryCalc, "code")
          : DEFAULT_SALARY_CALC_OPTIONS;
        const mappedOtCalc = optOtCalc.length
          ? toDynamicOptions(optOtCalc, "description")
          : DEFAULT_OT_CALC_OPTIONS;
        const mappedSlipFormat = optSlipFormat.length
          ? toDynamicOptions(optSlipFormat, "code")
          : DEFAULT_SLIP_FORMAT_OPTIONS;

        setSalaryBasisOptions(mappedBasis);
        setWorkingDaysOptions(mappedWorkingDays);
        setSalaryCalcOptions(mappedSalaryCalc);
        setOtCalcOptions(mappedOtCalc);
        setSlipFormatOptions(mappedSlipFormat);

        const currentOptGroups: OptGroups = {
          salaryBasis: mappedBasis,
          workingDays: mappedWorkingDays,
          salaryCalc: mappedSalaryCalc,
          otCalc: mappedOtCalc,
          slipFormat: mappedSlipFormat,
        };

        if (settingsResult.data) {
          const dynamicFields = [
            ...buildSalaryCalculationFields(mappedBasis, mappedWorkingDays, mappedSalaryCalc, t),
            ...buildOvertimeValueFields(mappedOtCalc, t),
            ...buildSlipFormatField(mappedSlipFormat, t),
          ];
          setValues({
            ...buildInitialFormValues(dynamicFields),
            ...toFormValues(settingsResult.data, currentOptGroups),
          });
          setErrors({});
        }

        if (!settingsResult.ok) {
          toast.error({
            title: t("settings.common.loadFailed"),
            message: settingsResult.message,
          });
        }
      } catch {
        if (cancelled) return;
        toast.error({
          title: "Unable to load settings",
          message: t("settings.payroll.loadError"),
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
        title: t("settings.common.validationError"),
        message: t("settings.payroll.validationMessage"),
      });
      return;
    }

    setSaving(true);
    try {
      const result = await payrollSettingsService.update({
        salary_basis: Number(values.salary_basis) || String(values.salary_basis ?? "1"),
        working_days_basis: Number(values.working_days_basis) || 1,
        salary_calculation_based_on: Number(values.salary_calculation_based_on) || 1,
        ot_applicable: toFlag(values.ot_applicable),
        ot_calculation_based_on: String(values.ot_calculation_based_on || "Basic"),
        normal_day_ot_rate: toNumber(values.normal_day_ot_rate, 1.5),
        weekly_off_ot_rate: toNumber(values.weekly_off_ot_rate, 2),
        holiday_ot_rate: toNumber(values.holiday_ot_rate, 2),
        min_ot_minutes: toNumber(values.min_ot_minutes, 30),
        salary_slip_format: Number(values.salary_slip_format) || 1,
        generate_automatically: toFlag(values.generate_automatically),
        show_attendance_details: toFlag(values.show_attendance_details),
        show_leave_details: toFlag(values.show_leave_details),
        show_earnings: toFlag(values.show_earnings),
        show_deductions: toFlag(values.show_deductions),
        show_employer_contributions: toFlag(values.show_employer_contributions),
        show_bank_details: toFlag(values.show_bank_details),
        digital_signature: toFlag(values.digital_signature),
      });

      if (!result.ok || !result.data) {
        toast.error({ title: t("settings.common.saveFailed"), message: result.message });
        return;
      }

      setValues((prev) => ({
        ...prev,
        ...toFormValues(result.data!, {
          salaryBasis: salaryBasisOptions,
          workingDays: workingDaysOptions,
          salaryCalc: salaryCalcOptions,
          otCalc: otCalcOptions,
          slipFormat: slipFormatOptions,
        }),
      }));
      toast.success({ title: t("settings.common.saved"), message: result.message });
    } catch {
      toast.error({
        title: t("settings.common.saveFailed"),
        message: t("settings.payroll.saveError"),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t("settings.payroll.title")}
        section={t("settings.common.section")}
        hideTitle
      />
      {loading ? (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <TableSectionHeader title={t("settings.payroll.title")} />
              <div className="employee-profile-loading">
                <RoundLoader />
                <p>{t("settings.payroll.loading")}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <form id="payroll-settings-form" onSubmit={(event) => void handleSave(event)} noValidate>
                <TableSectionHeader title={t("settings.payroll.salaryCalcTitle")} />
                <div className="form-grid form-grid-2">
                  <FormFieldsRenderer
                    fields={salaryCalculationFields}
                    values={values}
                    errors={errors}
                    onChange={handleChange}
                  />
                </div>

                <div className="email-config-test-block">
                  <TableSectionHeader title={t("settings.payroll.overtimeTitle")} />

                  <div className="notification-option-list">
                    <div className="notification-option">
                      <div className="notification-option-main">
                        <div className="avatar avatar-soft-primary">
                          <Timer size={18} />
                        </div>
                        <div className="notification-option-copy">
                          <h6>{t("settings.payroll.otApplicable.label")}</h6>
                          <p>{t("settings.payroll.otApplicable.description")}</p>
                        </div>
                      </div>
                      <StatusToggle
                        name="ot_applicable"
                        value={String(values.ot_applicable ?? "0")}
                        activeLabel={t("common.yes")}
                        inactiveLabel={t("common.no")}
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
                  <TableSectionHeader title={t("settings.payroll.slipTitle")} />

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
                              <h6>{t(`settings.payroll.toggles.${option.name}.label`)}</h6>
                              <p>{t(`settings.payroll.toggles.${option.name}.description`)}</p>
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
                </div>

                <div className="flex justify-end pt-4">
                  <button type="submit" className="btn btn-primary inline-flex items-center gap-2" disabled={saving}>
                    <Banknote size={16} />
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
