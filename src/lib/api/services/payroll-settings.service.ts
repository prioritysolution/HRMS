import { MOCK_PAYROLL_SETTINGS, type PayrollSettings } from "@/data/settings-mock";

export type PayrollSettingsActionResult<T> = {
  ok: boolean;
  data?: T;
  message: string;
};

function cloneSettings(source: PayrollSettings): PayrollSettings {
  return { ...source };
}

/** In-memory demo store until Payroll Settings API is available. */
let settingsStore = cloneSettings(MOCK_PAYROLL_SETTINGS);

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toFlag(value: unknown): 0 | 1 {
  return String(value ?? "").trim() === "0" ? 0 : 1;
}

function toPositiveNumber(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
}

function asSalaryBasis(value: unknown): PayrollSettings["salary_basis"] {
  const text = String(value ?? "").trim();
  if (text === "daily" || text === "hourly") return text;
  return "monthly";
}

function asWorkingDaysBasis(value: unknown): PayrollSettings["working_days_basis"] {
  const text = String(value ?? "").trim();
  if (
    text === "actual_working_days" ||
    text === "fixed_26" ||
    text === "fixed_30"
  ) {
    return text;
  }
  return "calendar_days";
}

function asSalaryCalculationBasedOn(
  value: unknown,
): PayrollSettings["salary_calculation_based_on"] {
  const text = String(value ?? "").trim();
  if (text === "paid_days" || text === "working_days") return text;
  return "attendance";
}

function asOtCalculationBasedOn(value: unknown): PayrollSettings["ot_calculation_based_on"] {
  return String(value ?? "").trim() === "hourly_rate" ? "hourly_rate" : "basic";
}

function asSalarySlipFormat(value: unknown): PayrollSettings["salary_slip_format"] {
  const text = String(value ?? "").trim();
  if (text === "a5" || text === "letter") return text;
  return "a4";
}

export const payrollSettingsService = {
  get: async (): Promise<PayrollSettingsActionResult<PayrollSettings>> => {
    await delay();
    return {
      ok: true,
      data: cloneSettings(settingsStore),
      message: "Payroll settings loaded (demo).",
    };
  },

  update: async (
    payload: PayrollSettings,
  ): Promise<PayrollSettingsActionResult<PayrollSettings>> => {
    await delay();
    settingsStore = cloneSettings({
      salary_basis: asSalaryBasis(payload.salary_basis),
      working_days_basis: asWorkingDaysBasis(payload.working_days_basis),
      salary_calculation_based_on: asSalaryCalculationBasedOn(payload.salary_calculation_based_on),
      ot_applicable: toFlag(payload.ot_applicable),
      ot_calculation_based_on: asOtCalculationBasedOn(payload.ot_calculation_based_on),
      normal_day_ot_rate: toPositiveNumber(
        payload.normal_day_ot_rate,
        settingsStore.normal_day_ot_rate,
      ),
      weekly_off_ot_rate: toPositiveNumber(
        payload.weekly_off_ot_rate,
        settingsStore.weekly_off_ot_rate,
      ),
      holiday_ot_rate: toPositiveNumber(payload.holiday_ot_rate, settingsStore.holiday_ot_rate),
      minimum_ot_minutes: toPositiveNumber(
        payload.minimum_ot_minutes,
        settingsStore.minimum_ot_minutes,
      ),
      generate_salary_slip_automatically: toFlag(payload.generate_salary_slip_automatically),
      salary_slip_format: asSalarySlipFormat(payload.salary_slip_format),
      show_attendance_details: toFlag(payload.show_attendance_details),
      show_leave_details: toFlag(payload.show_leave_details),
      show_earnings: toFlag(payload.show_earnings),
      show_deductions: toFlag(payload.show_deductions),
      show_employer_contributions: toFlag(payload.show_employer_contributions),
      show_bank_details: toFlag(payload.show_bank_details),
      digital_signature: toFlag(payload.digital_signature),
    });
    return {
      ok: true,
      data: cloneSettings(settingsStore),
      message: "Payroll settings saved (demo).",
    };
  },
};
