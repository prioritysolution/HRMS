import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  PayrollSettingsRecord,
  PayrollSettingsWritePayload,
  SalarySlipSettingsRecord,
  SalarySlipSettingsWritePayload,
  CombinedPayrollSettings,
} from "@/lib/api/types";

export type PayrollSettingsActionResult<T> = {
  ok: boolean;
  data?: T;
  message: string;
};

function asPayrollSettingsRecord(value: unknown): PayrollSettingsRecord | undefined {
  if (!value || typeof value !== "object") return undefined;
  const hasDataKey = "data" in (value as Record<string, unknown>);
  const rawData = hasDataKey ? (value as Record<string, unknown>).data : value;
  if (!rawData || typeof rawData !== "object") return undefined;
  const data = Array.isArray(rawData) ? rawData[0] : rawData;
  if (!data) return undefined;
  return {
    setting_id: Number(data.Setting_Id ?? data.setting_id) || undefined,
    salary_basis: data.Salary_Basis ?? data.salary_basis ?? "",
    salary_basis_name: String(data.Salary_Basis_Name ?? data.salary_basis_name ?? "").trim() || undefined,
    working_days_basis: data.Working_Days_Basis ?? data.working_days_basis ?? "",
    working_days_basis_name: String(data.Working_Days_Basis_Name ?? data.working_days_basis_name ?? "").trim() || undefined,
    salary_calculation_based_on: data.Salary_Calculation_Based_On ?? data.salary_calculation_based_on ?? "",
    salary_calculation_based_on_name: String(data.Salary_Calculation_Based_On_Name ?? data.salary_calculation_based_on_name ?? "").trim() || undefined,
    ot_applicable: Number(data.Ot_Applicable ?? data.ot_applicable) ? 1 : 0,
    ot_calculation_based_on: String(data.Ot_Calculation_Based_On ?? data.ot_calculation_based_on ?? ""),
    ot_calculation_based_on_name: String(data.Ot_Calculation_Based_On_Name ?? data.ot_calculation_based_on_name ?? "").trim() || undefined,
    normal_day_ot_rate: Number(data.Normal_Day_Ot_Rate ?? data.normal_day_ot_rate ?? 1.5),
    weekly_off_ot_rate: Number(data.Weekly_Off_Ot_Rate ?? data.weekly_off_ot_rate ?? 2),
    holiday_ot_rate: Number(data.Holiday_Ot_Rate ?? data.holiday_ot_rate ?? 2),
    min_ot_minutes: Number(data.Min_Ot_Minutes ?? data.min_ot_minutes ?? 30),
  } as PayrollSettingsRecord;
}

function asSalarySlipSettingsRecord(value: unknown): SalarySlipSettingsRecord | undefined {
  if (!value || typeof value !== "object") return undefined;
  const hasDataKey = "data" in (value as Record<string, unknown>);
  const rawData = hasDataKey ? (value as Record<string, unknown>).data : value;
  if (!rawData || typeof rawData !== "object") return undefined;
  const data = Array.isArray(rawData) ? rawData[0] : rawData;
  if (!data) return undefined;
  return {
    setting_id: Number(data.Setting_Id ?? data.setting_id) || undefined,
    salary_slip_format: data.Salary_Slip_Format ?? data.salary_slip_format ?? "",
    salary_slip_format_name: String(data.Salary_Slip_Format_Name ?? data.salary_slip_format_name ?? "").trim() || undefined,
    generate_automatically: Number(data.Generate_Automatically ?? data.generate_automatically) ? 1 : 0,
    show_attendance_details: Number(data.Show_Attendance_Details ?? data.show_attendance_details) ? 1 : 0,
    show_leave_details: Number(data.Show_Leave_Details ?? data.show_leave_details) ? 1 : 0,
    show_earnings: Number(data.Show_Earnings ?? data.show_earnings) ? 1 : 0,
    show_deductions: Number(data.Show_Deductions ?? data.show_deductions) ? 1 : 0,
    show_employer_contributions: Number(data.Show_Employer_Contributions ?? data.show_employer_contributions) ? 1 : 0,
    show_bank_details: Number(data.Show_Bank_Details ?? data.show_bank_details) ? 1 : 0,
    digital_signature: Number(data.Digital_Signature ?? data.digital_signature) ? 1 : 0,
  } as SalarySlipSettingsRecord;
}

export const payrollSettingsService = {
  get: async (): Promise<PayrollSettingsActionResult<CombinedPayrollSettings>> => {
    try {
      const [payrollRes, slipRes] = await Promise.all([
        apiClient.get<unknown>(API_ENDPOINTS.payrollSettings.list),
        apiClient.get<unknown>(API_ENDPOINTS.salarySlipSettings.list),
      ]);

      const payrollData = asPayrollSettingsRecord(payrollRes);
      const slipData = asSalarySlipSettingsRecord(slipRes);

      if (!payrollData || !slipData) {
        throw new Error("Invalid response format");
      }

      return {
        ok: true,
        data: {
          ...payrollData,
          ...slipData,
        },
        message: "Payroll settings loaded.",
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to load payroll settings",
      };
    }
  },

  update: async (
    payload: CombinedPayrollSettings,
  ): Promise<PayrollSettingsActionResult<CombinedPayrollSettings>> => {
    try {
      const payrollPayload: PayrollSettingsWritePayload = {
        salary_basis: Number(payload.salary_basis) || payload.salary_basis,
        working_days_basis: Number(payload.working_days_basis) || payload.working_days_basis,
        salary_calculation_based_on: Number(payload.salary_calculation_based_on) || payload.salary_calculation_based_on,
        ot_applicable: payload.ot_applicable ? 1 : 0,
        ot_calculation_based_on: String(payload.ot_calculation_based_on || "Basic"),
        normal_day_ot_rate: Number(payload.normal_day_ot_rate),
        weekly_off_ot_rate: Number(payload.weekly_off_ot_rate),
        holiday_ot_rate: Number(payload.holiday_ot_rate),
        min_ot_minutes: Number(payload.min_ot_minutes),
      };

      const slipPayload: SalarySlipSettingsWritePayload = {
        salary_slip_format: Number(payload.salary_slip_format) || payload.salary_slip_format,
        generate_automatically: payload.generate_automatically ? 1 : 0,
        show_attendance_details: payload.show_attendance_details ? 1 : 0,
        show_leave_details: payload.show_leave_details ? 1 : 0,
        show_earnings: payload.show_earnings ? 1 : 0,
        show_deductions: payload.show_deductions ? 1 : 0,
        show_employer_contributions: payload.show_employer_contributions ? 1 : 0,
        show_bank_details: payload.show_bank_details ? 1 : 0,
        digital_signature: payload.digital_signature ? 1 : 0,
      };

      const [payrollRes, slipRes] = await Promise.all([
        apiClient.put<unknown>(API_ENDPOINTS.payrollSettings.save, payrollPayload),
        apiClient.put<unknown>(API_ENDPOINTS.salarySlipSettings.save, slipPayload),
      ]);

      const payrollData = asPayrollSettingsRecord(payrollRes);
      const slipData = asSalarySlipSettingsRecord(slipRes);

      return {
        ok: true,
        data: {
          ...(payrollData ?? (payrollPayload as unknown as PayrollSettingsRecord)),
          ...(slipData ?? (slipPayload as unknown as SalarySlipSettingsRecord)),
        },
        message: "Payroll settings saved successfully.",
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to save payroll settings",
      };
    }
  },
};
