"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileBadge2,
  IndianRupee,
  Plus,
  Receipt,
  Scale,
} from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { FormFieldsRenderer, buildInitialFormValues } from "@/components/ui/FormFieldsRenderer";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoundLoader } from "@/components/ui/RoundLoader";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { TableSectionHeader } from "@/components/ui/TableSectionHeader";
import { useToast } from "@/components/ui/ToastProvider";
import type { ProfessionalTaxSlab, TaxSettings } from "@/data/settings-mock";
import { applOptionService, OPT_GRP_IDS } from "@/lib/api/services/appl-options.service";
import { finYearService } from "@/lib/api/services/fin-year.service";
import { taxSettingsService } from "@/lib/api/services/tax-settings.service";
import type { ApplOptionRecord } from "@/lib/api/types";
import { validateFormField, validateFormFields, type FormValue } from "@/lib/form-validation";
import type { FormField, HrmsRow } from "@/types/hrms";

type DynamicOption = {
  value: string;
  label: string;
  code?: string;
  optionId?: string;
  yearId?: string;
};

const DEFAULT_STATE_OPTIONS: DynamicOption[] = [
  { value: "Gujarat", label: "Gujarat" },
  { value: "Maharashtra", label: "Maharashtra" },
  { value: "Karnataka", label: "Karnataka" },
  { value: "Tamil Nadu", label: "Tamil Nadu" },
  { value: "West Bengal", label: "West Bengal" },
  { value: "Telangana", label: "Telangana" },
  { value: "Madhya Pradesh", label: "Madhya Pradesh" },
];

const DEFAULT_FREQUENCY_OPTIONS: DynamicOption[] = [
  { value: "Monthly", label: "Monthly" },
  { value: "Half-Yearly", label: "Half-Yearly" },
  { value: "Yearly", label: "Yearly" },
];

const DEFAULT_PT_BASED_ON_OPTIONS: DynamicOption[] = [
  { value: "Gross Salary", label: "Gross Salary" },
  { value: "Basic Salary", label: "Basic Salary" },
];

const DEFAULT_REGIME_OPTIONS: DynamicOption[] = [
  { value: "New Regime", label: "New Regime" },
  { value: "Old Regime", label: "Old Regime" },
];

const DEFAULT_TDS_METHOD_OPTIONS: DynamicOption[] = [
  { value: "Monthly Projection", label: "Monthly Projection" },
  { value: "Actual", label: "Actual" },
];

function toDynamicOptions(
  records: ApplOptionRecord[],
  valueMode: "code" | "description" = "description",
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

const slabFields: FormField[] = [
  {
    label: "From Amount (₹)",
    name: "from_amount",
    type: "number",
    required: true,
    min: 0,
    defaultValue: "0",
  },
  {
    label: "To Amount (₹)",
    name: "to_amount",
    type: "number",
    required: false,
    min: 0,
    placeholder: "Leave blank for no upper limit",
  },
  {
    label: "Tax Amount (₹)",
    name: "tax_amount",
    type: "number",
    required: true,
    min: 0,
    defaultValue: "0",
  },
];

const TDS_TOGGLES = [
  {
    name: "round_off_tds" as const,
    label: "Round Off TDS",
    description: "Round TDS amount to the nearest rupee.",
    icon: Scale,
  },
  {
    name: "consider_previous_employment" as const,
    label: "Consider Previous Employment",
    description: "Include previous employer income and TDS while calculating.",
    icon: Receipt,
  },
  {
    name: "auto_generate_form16" as const,
    label: "Auto Generate Form 16",
    description: "Generate Form 16 automatically after year-end processing.",
    icon: FileBadge2,
  },
  {
    name: "show_tds_on_payslip" as const,
    label: "Show TDS on Payslip",
    description: "Display TDS deduction details on the salary slip.",
    icon: IndianRupee,
  },
] as const;

function toFlag(value: FormValue): 0 | 1 {
  return String(value ?? "").trim() === "0" ? 0 : 1;
}

function toNumber(value: FormValue, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "No limit";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function resolveOptionValue(
  rawValue: unknown,
  options: DynamicOption[],
  fallbackDefault = "",
): string {
  const valStr = String(rawValue ?? "").trim().toLowerCase();
  if (!valStr) return options[0]?.value ?? fallbackDefault;

  const exact = options.find(
    (o) =>
      o.value.toLowerCase() === valStr ||
      o.label.toLowerCase() === valStr ||
      (o.code && o.code.toLowerCase() === valStr) ||
      (o.optionId && o.optionId.toLowerCase() === valStr) ||
      (o.yearId && o.yearId.toLowerCase() === valStr),
  );
  if (exact) return exact.value;

  const partial = options.find(
    (o) =>
      valStr.includes(o.value.toLowerCase()) ||
      valStr.includes(o.label.toLowerCase()) ||
      o.value.toLowerCase().includes(valStr) ||
      o.label.toLowerCase().includes(valStr),
  );
  if (partial) return partial.value;

  return options[0]?.value ?? fallbackDefault;
}

export default function TaxSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSlab, setSavingSlab] = useState(false);
  const [slabs, setSlabs] = useState<ProfessionalTaxSlab[]>([]);

  const [frequencyOptions, setFrequencyOptions] = useState<DynamicOption[]>(DEFAULT_FREQUENCY_OPTIONS);
  const [ptBasedOnOptions, setPtBasedOnOptions] = useState<DynamicOption[]>(DEFAULT_PT_BASED_ON_OPTIONS);
  const [regimeOptions, setRegimeOptions] = useState<DynamicOption[]>(DEFAULT_REGIME_OPTIONS);
  const [tdsMethodOptions, setTdsMethodOptions] = useState<DynamicOption[]>(DEFAULT_TDS_METHOD_OPTIONS);
  const [finYearOptions, setFinYearOptions] = useState<DynamicOption[]>([
    { value: "1", label: "2026-2027", yearId: "1" },
  ]);

  const ptConfigFields = useMemo<FormField[]>(
    () => [
      {
        label: "State",
        name: "pt_state",
        type: "select",
        required: true,
        defaultValue: "Gujarat",
        options: DEFAULT_STATE_OPTIONS,
      },
      {
        label: "Deduction Frequency",
        name: "pt_deduction_frequency",
        type: "select",
        required: true,
        defaultValue: frequencyOptions[0]?.value ?? "Monthly",
        options: frequencyOptions,
      },
      {
        label: "PT Based On",
        name: "pt_based_on",
        type: "select",
        required: true,
        defaultValue: ptBasedOnOptions[0]?.value ?? "Gross Salary",
        options: ptBasedOnOptions,
      },
    ],
    [frequencyOptions, ptBasedOnOptions],
  );

  const tdsConfigFields = useMemo<FormField[]>(
    () => [
      {
        label: "Tax Regime",
        name: "tax_regime",
        type: "select",
        required: true,
        defaultValue: regimeOptions[0]?.value ?? "New Regime",
        options: regimeOptions,
      },
      {
        label: "Financial Year",
        name: "fin_year_id",
        type: "select",
        required: true,
        defaultValue: finYearOptions[0]?.value ?? "1",
        options: finYearOptions,
      },
      {
        label: "TDS Calculation Method",
        name: "tds_calculation_method",
        type: "select",
        required: true,
        defaultValue: tdsMethodOptions[0]?.value ?? "Monthly Projection",
        options: tdsMethodOptions,
      },
      {
        label: "Standard Deduction (₹)",
        name: "standard_deduction",
        type: "number",
        required: true,
        min: 0,
        max: 200000,
        defaultValue: "75000",
      },
    ],
    [regimeOptions, finYearOptions, tdsMethodOptions],
  );

  const allConfigFields = useMemo(
    () => [...ptConfigFields, ...tdsConfigFields],
    [ptConfigFields, tdsConfigFields],
  );

  const [values, setValues] = useState<Record<string, FormValue>>(() => ({
    pt_applicable: "1",
    pt_state: "Gujarat",
    pt_deduction_frequency: "Monthly",
    pt_based_on: "Gross Salary",
    tds_applicable: "1",
    tax_regime: "New Regime",
    fin_year_id: "1",
    tds_calculation_method: "Monthly Projection",
    standard_deduction: "75000",
    round_off_tds: "1",
    consider_previous_employment: "1",
    auto_generate_form16: "1",
    show_tds_on_payslip: "1",
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slabModalOpen, setSlabModalOpen] = useState(false);
  const [editSlab, setEditSlab] = useState<ProfessionalTaxSlab | null>(null);
  const [slabValues, setSlabValues] = useState<Record<string, FormValue>>(() =>
    buildInitialFormValues(slabFields),
  );
  const [slabErrors, setSlabErrors] = useState<Record<string, string>>({});

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [
        optFrequency,
        optPtBasedOn,
        optTaxRegime,
        optTdsMethod,
        fyOpts,
        result,
      ] = await Promise.all([
        applOptionService.list({ opt_grp_id: OPT_GRP_IDS.DEDUCTION_FREQUENCY, is_active: 1 }).catch(() => []),
        applOptionService.list({ opt_grp_id: OPT_GRP_IDS.PT_BASED_ON, is_active: 1 }).catch(() => []),
        applOptionService.list({ opt_grp_id: OPT_GRP_IDS.TAX_REGIME, is_active: 1 }).catch(() => []),
        applOptionService.list({ opt_grp_id: OPT_GRP_IDS.TDS_CALCULATION_METHOD, is_active: 1 }).catch(() => []),
        finYearService.options().catch(() => []),
        taxSettingsService.get(),
      ]);

      const mappedFrequency = optFrequency.length
        ? toDynamicOptions(optFrequency, "description")
        : DEFAULT_FREQUENCY_OPTIONS;
      const mappedPtBasedOn = optPtBasedOn.length
        ? toDynamicOptions(optPtBasedOn, "description")
        : DEFAULT_PT_BASED_ON_OPTIONS;
      const mappedTaxRegime = optTaxRegime.length
        ? toDynamicOptions(optTaxRegime, "description")
        : DEFAULT_REGIME_OPTIONS;
      const mappedTdsMethod = optTdsMethod.length
        ? toDynamicOptions(optTdsMethod, "description")
        : DEFAULT_TDS_METHOD_OPTIONS;
      const mappedFyOptions: DynamicOption[] = fyOpts.length
        ? fyOpts.map((opt) => ({
            value: String(opt.yearId || opt.value),
            label: opt.label,
            yearId: String(opt.yearId || opt.value),
          }))
        : [{ value: "1", label: "2026-2027", yearId: "1" }];

      setFrequencyOptions(mappedFrequency);
      setPtBasedOnOptions(mappedPtBasedOn);
      setRegimeOptions(mappedTaxRegime);
      setTdsMethodOptions(mappedTdsMethod);
      setFinYearOptions(mappedFyOptions);

      if (result.data) {
        const data = result.data;
        const fyValue = resolveOptionValue(
          data.financial_year,
          mappedFyOptions,
          mappedFyOptions[0]?.value ?? "1",
        );

        setValues({
          pt_applicable: String(data.pt_applicable ?? "1"),
          pt_state: resolveOptionValue(data.pt_state, DEFAULT_STATE_OPTIONS, "Gujarat"),
          pt_deduction_frequency: resolveOptionValue(
            data.pt_deduction_frequency,
            mappedFrequency,
            "Monthly",
          ),
          pt_based_on: resolveOptionValue(
            data.pt_based_on,
            mappedPtBasedOn,
            "Gross Salary",
          ),
          tds_applicable: String(data.tds_applicable ?? "1"),
          tax_regime: resolveOptionValue(data.tax_regime, mappedTaxRegime, "New Regime"),
          fin_year_id: fyValue,
          tds_calculation_method: resolveOptionValue(
            data.tds_calculation_method,
            mappedTdsMethod,
            "Monthly Projection",
          ),
          standard_deduction: String(data.standard_deduction ?? "75000"),
          round_off_tds: String(data.round_off_tds ?? "1"),
          consider_previous_employment: String(data.consider_previous_employment ?? "1"),
          auto_generate_form16: String(data.auto_generate_form16 ?? "1"),
          show_tds_on_payslip: String(data.show_tds_on_payslip ?? "1"),
        });
        setSlabs(data.pt_slabs ?? []);
        setErrors({});
      }

      if (!result.ok) {
        toast.error({
          title: "Unable to load settings",
          message: result.message,
        });
      }
    } catch {
      toast.error({
        title: "Unable to load settings",
        message: "Failed to load tax settings. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (!slabModalOpen) {
      setEditSlab(null);
      setSlabValues(buildInitialFormValues(slabFields));
      setSlabErrors({});
      return;
    }
    if (editSlab) {
      setSlabValues(
        buildInitialFormValues(slabFields, {
          ...(editSlab as unknown as HrmsRow),
          to_amount:
            editSlab.to_amount === null || editSlab.to_amount === undefined
              ? ""
              : String(editSlab.to_amount),
        }),
      );
    } else {
      setSlabValues(buildInitialFormValues(slabFields));
    }
    setSlabErrors({});
  }, [slabModalOpen, editSlab]);

  const handleChange = (name: string, value: FormValue) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    const field = allConfigFields.find((item) => item.name === name);
    if (!field) return;
    setErrors((prev) => {
      const next = { ...prev };
      const error = validateFormField(field, value);
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
  };

  const handleSlabChange = (name: string, value: FormValue) => {
    setSlabValues((prev) => ({ ...prev, [name]: value }));
    const field = slabFields.find((item) => item.name === name);
    if (!field) return;
    setSlabErrors((prev) => {
      const next = { ...prev };
      const error = validateFormField(field, value);
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateFormFields(allConfigFields, values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error({
        title: "Validation error",
        message: "Please fill all mandatory tax settings.",
      });
      return;
    }

    setSaving(true);
    try {
      const selectedFyOption = finYearOptions.find((o) => o.value === String(values.fin_year_id));
      const finYearIdNum = selectedFyOption
        ? Number(selectedFyOption.yearId || selectedFyOption.value) || 1
        : Number(values.fin_year_id) || 1;

      const payload: TaxSettings & { fin_year_id?: number } = {
        pt_applicable: toFlag(values.pt_applicable),
        pt_state: String(values.pt_state ?? "Gujarat"),
        pt_deduction_frequency:
          String(values.pt_deduction_frequency) === "Half-Yearly"
            ? "half_yearly"
            : String(values.pt_deduction_frequency) === "Yearly"
              ? "yearly"
              : "monthly",
        pt_based_on: String(values.pt_based_on) === "Basic Salary" ? "basic" : "gross",
        pt_slabs: slabs,
        tds_applicable: toFlag(values.tds_applicable),
        tax_regime: String(values.tax_regime) === "Old Regime" ? "old" : "new",
        financial_year: selectedFyOption?.label || String(values.fin_year_id ?? "1"),
        fin_year_id: finYearIdNum,
        tds_calculation_method:
          String(values.tds_calculation_method) === "Actual" ? "actual" : "monthly_projection",
        standard_deduction: toNumber(values.standard_deduction, 75000),
        round_off_tds: toFlag(values.round_off_tds),
        consider_previous_employment: toFlag(values.consider_previous_employment),
        auto_generate_form16: toFlag(values.auto_generate_form16),
        show_tds_on_payslip: toFlag(values.show_tds_on_payslip),
      };

      const result = await taxSettingsService.update(payload);
      if (!result.ok || !result.data) {
        toast.error({ title: "Save failed", message: result.message });
        return;
      }

      const data = result.data;
      const fyValue = resolveOptionValue(
        data.financial_year,
        finYearOptions,
        finYearOptions[0]?.value ?? "1",
      );

      setValues({
        pt_applicable: String(data.pt_applicable ?? "1"),
        pt_state: resolveOptionValue(data.pt_state, DEFAULT_STATE_OPTIONS, "Gujarat"),
        pt_deduction_frequency: resolveOptionValue(
          data.pt_deduction_frequency,
          frequencyOptions,
          "Monthly",
        ),
        pt_based_on: resolveOptionValue(
          data.pt_based_on,
          ptBasedOnOptions,
          "Gross Salary",
        ),
        tds_applicable: String(data.tds_applicable ?? "1"),
        tax_regime: resolveOptionValue(data.tax_regime, regimeOptions, "New Regime"),
        fin_year_id: fyValue,
        tds_calculation_method: resolveOptionValue(
          data.tds_calculation_method,
          tdsMethodOptions,
          "Monthly Projection",
        ),
        standard_deduction: String(data.standard_deduction ?? "75000"),
        round_off_tds: String(data.round_off_tds ?? "1"),
        consider_previous_employment: String(data.consider_previous_employment ?? "1"),
        auto_generate_form16: String(data.auto_generate_form16 ?? "1"),
        show_tds_on_payslip: String(data.show_tds_on_payslip ?? "1"),
      });
      toast.success({ title: "Saved", message: result.message });
    } catch {
      toast.error({
        title: "Save failed",
        message: "Failed to save tax settings. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const openAddSlab = () => {
    setEditSlab(null);
    setSlabModalOpen(true);
  };

  const openEditSlab = (row: ProfessionalTaxSlab) => {
    setEditSlab(row);
    setSlabModalOpen(true);
  };

  const handleSaveSlab = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateFormFields(slabFields, slabValues);
    if (Object.keys(nextErrors).length > 0) {
      setSlabErrors(nextErrors);
      toast.error({
        title: "Validation error",
        message: "Please fill all mandatory slab fields.",
      });
      return;
    }

    const toAmountText = String(slabValues.to_amount ?? "").trim();
    const payload = {
      from_amount: toNumber(slabValues.from_amount, 0),
      to_amount: toAmountText === "" ? null : toNumber(slabValues.to_amount, 0),
      tax_amount: toNumber(slabValues.tax_amount, 0),
    };

    if (payload.to_amount !== null && payload.to_amount < payload.from_amount) {
      setSlabErrors((prev) => ({
        ...prev,
        to_amount: "To Amount must be greater than or equal to From Amount.",
      }));
      return;
    }

    setSavingSlab(true);
    try {
      const result = editSlab
        ? await taxSettingsService.updateSlab(editSlab.id, payload)
        : await taxSettingsService.createSlab(payload);

      if (!result.ok) {
        toast.error({ title: "Save failed", message: result.message });
        return;
      }

      const refreshed = await taxSettingsService.getSlabs();
      if (refreshed.ok && refreshed.data) {
        setSlabs(refreshed.data);
      } else {
        const fullRefreshed = await taxSettingsService.get();
        if (fullRefreshed.data) setSlabs(fullRefreshed.data.pt_slabs);
      }
      setSlabModalOpen(false);
      toast.success({ title: "Saved", message: result.message });
    } catch {
      toast.error({
        title: "Save failed",
        message: "Failed to save professional tax slab.",
      });
    } finally {
      setSavingSlab(false);
    }
  };

  const handleDeleteSlab = async (row: ProfessionalTaxSlab) => {
    try {
      const result = await taxSettingsService.removeSlab(row.id);
      if (!result.ok) {
        toast.error({ title: "Delete failed", message: result.message });
        return;
      }
      setSlabs((prev) => prev.filter((item) => item.id !== row.id));
      toast.success({ title: "Deleted", message: result.message });
    } catch {
      toast.error({
        title: "Delete failed",
        message: "Failed to delete professional tax slab.",
      });
    }
  };

  const slabColumns = useMemo<Column<ProfessionalTaxSlab>[]>(
    () => [
      {
        key: "from_amount",
        header: "FROM AMOUNT",
        render: (row) => formatCurrency(row.from_amount),
      },
      {
        key: "to_amount",
        header: "TO AMOUNT",
        render: (row) => formatCurrency(row.to_amount),
      },
      {
        key: "tax_amount",
        header: "TAX AMOUNT",
        render: (row) => formatCurrency(row.tax_amount),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader title="Tax Settings" section="Settings" hideTitle />

      {loading ? (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <TableSectionHeader title="Tax Settings" />
              <div className="employee-profile-loading">
                <RoundLoader />
                <p>Loading tax settings…</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <form id="tax-settings-form" onSubmit={(event) => void handleSave(event)} noValidate>
                <TableSectionHeader title="Professional Tax Configuration" />

                <div className="notification-option-list">
                  <div className="notification-option">
                    <div className="notification-option-main">
                      <div className="avatar avatar-soft-primary">
                        <IndianRupee size={18} />
                      </div>
                      <div className="notification-option-copy">
                        <h6>Professional Tax Applicable</h6>
                        <p>Enable professional tax deduction in payroll.</p>
                      </div>
                    </div>
                    <StatusToggle
                      name="pt_applicable"
                      value={String(values.pt_applicable ?? "0")}
                      activeLabel="Yes"
                      inactiveLabel="No"
                      onChange={(nextValue) => handleChange("pt_applicable", nextValue)}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="form-grid form-grid-2 pt-4">
                  <FormFieldsRenderer
                    fields={ptConfigFields}
                    values={values}
                    errors={errors}
                    onChange={handleChange}
                  />
                </div>

                <div className="pt-4">
                  <TableSectionHeader
                    title="Professional Tax Slabs"
                    action={
                      <button
                        type="button"
                        className="btn btn-primary inline-flex items-center gap-2"
                        onClick={openAddSlab}
                      >
                        <Plus size={16} />
                        Add Slab
                      </button>
                    }
                  />
                  <DataTable
                    columns={slabColumns}
                    rows={slabs}
                    searchPlaceholder="Search PT slabs..."
                    showRowActions
                    onRowEdit={openEditSlab}
                    onRowDelete={handleDeleteSlab}
                  />
                </div>

                <div className="email-config-test-block">
                  <TableSectionHeader title="TDS Settings" />

                  <div className="notification-option-list">
                    <div className="notification-option">
                      <div className="notification-option-main">
                        <div className="avatar avatar-soft-primary">
                          <Receipt size={18} />
                        </div>
                        <div className="notification-option-copy">
                          <h6>TDS Applicable</h6>
                          <p>Enable TDS deduction during salary processing.</p>
                        </div>
                      </div>
                      <StatusToggle
                        name="tds_applicable"
                        value={String(values.tds_applicable ?? "0")}
                        activeLabel="Yes"
                        inactiveLabel="No"
                        onChange={(nextValue) => handleChange("tds_applicable", nextValue)}
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="form-grid form-grid-2 pt-4">
                    <FormFieldsRenderer
                      fields={tdsConfigFields}
                      values={values}
                      errors={errors}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="notification-option-list pt-4">
                    {TDS_TOGGLES.map((option) => {
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
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={slabModalOpen}
        onClose={() => setSlabModalOpen(false)}
        title={editSlab ? "Edit PT Slab" : "Add PT Slab"}
        subtitle="Configure salary range and professional tax amount."
        size="md"
        footer={
          <>
            <button
              type="submit"
              form="pt-slab-form"
              className="btn btn-primary"
              disabled={savingSlab}
            >
              {savingSlab ? "Saving..." : "Save Slab"}
            </button>
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={() => setSlabModalOpen(false)}
              disabled={savingSlab}
            >
              Cancel
            </button>
          </>
        }
      >
        <form
          id="pt-slab-form"
          className="form-grid form-grid-2"
          onSubmit={(event) => void handleSaveSlab(event)}
          noValidate
        >
          <FormFieldsRenderer
            fields={slabFields}
            values={slabValues}
            errors={slabErrors}
            onChange={handleSlabChange}
          />
        </form>
      </Modal>
    </>
  );
}
