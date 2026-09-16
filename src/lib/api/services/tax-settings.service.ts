import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  ProfessionalTaxSlab,
  TaxSettings,
} from "@/data/settings-mock";
import type {
  PtSettingsRecord,
  PtSettingsWritePayload,
  PtSlabCreatePayload,
  PtSlabRecord,
  PtSlabUpdatePayload,
  TdsSettingsRecord,
  TdsSettingsWritePayload,
} from "@/lib/api/types";

export type TaxSettingsActionResult<T> = {
  ok: boolean;
  data?: T;
  message: string;
};

function normalizeFrequency(freq: unknown): "monthly" | "half_yearly" | "yearly" {
  const s = String(freq ?? "").toLowerCase().trim();
  if (s === "2" || s.includes("half") || s === "half_yearly") return "half_yearly";
  if (s === "3" || s.includes("year") || s === "yearly") return "yearly";
  return "monthly";
}

function toFrequencyString(freq: unknown): string {
  const normalized = normalizeFrequency(freq);
  if (normalized === "half_yearly") return "Half-Yearly";
  if (normalized === "yearly") return "Yearly";
  return "Monthly";
}

function normalizePtBasedOn(based: unknown): "gross" | "basic" {
  const s = String(based ?? "").toLowerCase().trim();
  if (s === "2" || s.includes("basic")) return "basic";
  return "gross";
}

function toPtBasedOnString(based: unknown): string {
  return normalizePtBasedOn(based) === "basic" ? "Basic Salary" : "Gross Salary";
}

function normalizeTaxRegime(regime: unknown): "old" | "new" {
  const s = String(regime ?? "").toLowerCase().trim();
  if (s === "2" || s.includes("old") || s.includes("2")) return "old";
  return "new";
}

function toTaxRegimeString(regime: unknown): string | number {
  const normalized = normalizeTaxRegime(regime);
  return normalized === "old" ? 2 : 1;
}

function normalizeTdsMethod(method: unknown): "monthly_projection" | "actual" {
  const s = String(method ?? "").toLowerCase().trim();
  if (s === "2" || s.includes("actual") || s.includes("2")) return "actual";
  return "monthly_projection";
}

function toTdsMethodString(method: unknown): string | number {
  const normalized = normalizeTdsMethod(method);
  return normalized === "actual" ? 2 : 1;
}

function readFirstDataRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object") return undefined;
  const rec = value as Record<string, unknown>;
  const rawData = "data" in rec ? rec.data : value;
  if (!rawData || typeof rawData !== "object") return undefined;
  const data = Array.isArray(rawData) ? rawData[0] : rawData;
  if (!data || typeof data !== "object") return undefined;
  return data as Record<string, unknown>;
}

function asPtSettingsRecord(value: unknown): PtSettingsRecord | undefined {
  const rec = readFirstDataRecord(value);
  if (!rec) return undefined;
  return {
    pt_applicable: Number(rec.Pt_Applicable ?? rec.pt_applicable) === 1 ? 1 : 0,
    state: String(rec.State_Name ?? rec.state_name ?? rec.State ?? rec.state ?? "Gujarat").trim(),
    deduction_frequency: String(
      rec.Deduction_Frequency_Name ??
        rec.deduction_frequency_name ??
        rec.Deduction_Frequency ??
        rec.deduction_frequency ??
        "Monthly",
    ).trim(),
    pt_based_on: String(
      rec.Pt_Based_On_Name ??
        rec.pt_based_on_name ??
        rec.Pt_Based_On ??
        rec.pt_based_on ??
        "Gross Salary",
    ).trim(),
  };
}

function asPtSlabsList(value: unknown): ProfessionalTaxSlab[] {
  if (!value || typeof value !== "object") return [];
  const hasDataKey = "data" in (value as Record<string, unknown>);
  const rawData = hasDataKey ? (value as Record<string, unknown>).data : value;
  if (!Array.isArray(rawData)) return [];
  return rawData.map((item: Record<string, unknown>) => {
    const id = String(item.Slab_Id ?? item.slab_id ?? item.id ?? item.Srl_No ?? item.srl_no ?? "");
    const toRaw = item.To_Amount ?? item.to_amount;
    return {
      id,
      from_amount: Number(item.From_Amount ?? item.from_amount ?? 0),
      to_amount: toRaw === null || toRaw === undefined || toRaw === "" ? null : Number(toRaw),
      tax_amount: Number(item.Tax_Amount ?? item.tax_amount ?? 0),
    };
  });
}

function asTdsSettingsRecord(value: unknown): TdsSettingsRecord | undefined {
  const rec = readFirstDataRecord(value);
  if (!rec) return undefined;
  return {
    setting_id: Number(rec.Setting_Id ?? rec.setting_id) || undefined,
    tds_applicable: Number(rec.Tds_Applicable ?? rec.tds_applicable) === 1 ? 1 : 0,
    tax_regime: String(
      rec.Tax_Regime_Name ?? rec.tax_regime_name ?? rec.Tax_Regime ?? rec.tax_regime ?? "New Regime",
    ).trim(),
    fin_year_id: Number(rec.Fin_Year_Id ?? rec.fin_year_id ?? rec.year_id) || 1,
    financial_year: String(rec.Financial_Year ?? rec.financial_year ?? rec.year_name ?? "").trim(),
    tds_calculation_method: String(
      rec.Tds_Calculation_Method_Name ??
        rec.tds_calculation_method_name ??
        rec.Tds_Calculation_Method ??
        rec.tds_calculation_method ??
        "Monthly Projection",
    ).trim(),
    standard_deduction: Number(rec.Standard_Deduction ?? rec.standard_deduction ?? 75000),
    round_off_tds: Number(rec.Round_Off_Tds ?? rec.round_off_tds) === 1 ? 1 : 0,
    consider_previous_employment:
      Number(rec.Consider_Previous_Employment ?? rec.consider_previous_employment) === 1 ? 1 : 0,
    auto_generate_form_16:
      Number(
        rec.Auto_Generate_Form_16 ??
          rec.auto_generate_form_16 ??
          rec.Auto_Generate_Form16 ??
          rec.auto_generate_form16,
      ) === 1
        ? 1
        : 0,
    show_tds_on_payslip:
      Number(rec.Show_Tds_On_Payslip ?? rec.show_tds_on_payslip) === 1 ? 1 : 0,
  };
}

export const taxSettingsService = {
  get: async (): Promise<TaxSettingsActionResult<TaxSettings>> => {
    try {
      const [ptRes, slabsRes, tdsRes] = await Promise.all([
        apiClient.get<unknown>(API_ENDPOINTS.ptSettings.list).catch(() => undefined),
        apiClient.get<unknown>(API_ENDPOINTS.ptSlabs.list()).catch(() => undefined),
        apiClient.get<unknown>(API_ENDPOINTS.tdsSettings.list).catch(() => undefined),
      ]);

      const ptRec = asPtSettingsRecord(ptRes);
      const slabsList = asPtSlabsList(slabsRes);
      const tdsRec = asTdsSettingsRecord(tdsRes);

      const combined: TaxSettings = {
        pt_applicable: ptRec ? ptRec.pt_applicable : 0,
        pt_state: ptRec ? ptRec.state : "Gujarat",
        pt_deduction_frequency: normalizeFrequency(ptRec?.deduction_frequency),
        pt_based_on: normalizePtBasedOn(ptRec?.pt_based_on),
        pt_slabs: slabsList,
        tds_applicable: tdsRec ? tdsRec.tds_applicable : 0,
        tax_regime: normalizeTaxRegime(tdsRec?.tax_regime),
        financial_year: tdsRec?.financial_year || String(tdsRec?.fin_year_id ?? "1"),
        tds_calculation_method: normalizeTdsMethod(tdsRec?.tds_calculation_method),
        standard_deduction: tdsRec?.standard_deduction ?? 75000,
        round_off_tds: tdsRec ? tdsRec.round_off_tds : 0,
        consider_previous_employment: tdsRec ? tdsRec.consider_previous_employment : 0,
        auto_generate_form16: tdsRec ? tdsRec.auto_generate_form_16 : 0,
        show_tds_on_payslip: tdsRec ? tdsRec.show_tds_on_payslip : 0,
      };

      return {
        ok: true,
        data: combined,
        message: "Tax settings loaded successfully.",
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to load tax settings",
      };
    }
  },

  update: async (
    payload: TaxSettings & { fin_year_id?: number },
  ): Promise<TaxSettingsActionResult<TaxSettings>> => {
    try {
      const ptPayload: PtSettingsWritePayload = {
        pt_applicable: payload.pt_applicable ? 1 : 0,
        state: payload.pt_state || "Gujarat",
        deduction_frequency: toFrequencyString(payload.pt_deduction_frequency),
        pt_based_on: toPtBasedOnString(payload.pt_based_on),
      };

      const tdsPayload: TdsSettingsWritePayload = {
        tds_applicable: payload.tds_applicable ? 1 : 0,
        tax_regime: String(toTaxRegimeString(payload.tax_regime)),
        fin_year_id: payload.fin_year_id ?? (Number(payload.financial_year) || 1),
        tds_calculation_method: String(toTdsMethodString(payload.tds_calculation_method)),
        standard_deduction: Number(payload.standard_deduction) || 75000,
        round_off_tds: payload.round_off_tds ? 1 : 0,
        consider_previous_employment: payload.consider_previous_employment ? 1 : 0,
        auto_generate_form_16: payload.auto_generate_form16 ? 1 : 0,
        show_tds_on_payslip: payload.show_tds_on_payslip ? 1 : 0,
      };

      const [ptRes, tdsRes] = await Promise.all([
        apiClient.put<unknown>(API_ENDPOINTS.ptSettings.save, ptPayload),
        apiClient.put<unknown>(API_ENDPOINTS.tdsSettings.save, tdsPayload),
      ]);

      const updatedPt = asPtSettingsRecord(ptRes);
      const updatedTds = asTdsSettingsRecord(tdsRes);

      const updatedCombined: TaxSettings = {
        pt_applicable: updatedPt ? updatedPt.pt_applicable : ptPayload.pt_applicable,
        pt_state: updatedPt ? updatedPt.state : ptPayload.state,
        pt_deduction_frequency: normalizeFrequency(updatedPt?.deduction_frequency ?? ptPayload.deduction_frequency),
        pt_based_on: normalizePtBasedOn(updatedPt?.pt_based_on ?? ptPayload.pt_based_on),
        pt_slabs: payload.pt_slabs ?? [],
        tds_applicable: updatedTds ? updatedTds.tds_applicable : tdsPayload.tds_applicable,
        tax_regime: normalizeTaxRegime(updatedTds?.tax_regime ?? tdsPayload.tax_regime),
        financial_year: updatedTds?.financial_year || String(updatedTds?.fin_year_id ?? tdsPayload.fin_year_id),
        tds_calculation_method: normalizeTdsMethod(updatedTds?.tds_calculation_method ?? tdsPayload.tds_calculation_method),
        standard_deduction: updatedTds?.standard_deduction ?? tdsPayload.standard_deduction,
        round_off_tds: updatedTds ? updatedTds.round_off_tds : tdsPayload.round_off_tds,
        consider_previous_employment: updatedTds ? updatedTds.consider_previous_employment : tdsPayload.consider_previous_employment,
        auto_generate_form16: updatedTds ? updatedTds.auto_generate_form_16 : tdsPayload.auto_generate_form_16,
        show_tds_on_payslip: updatedTds ? updatedTds.show_tds_on_payslip : tdsPayload.show_tds_on_payslip,
      };

      return {
        ok: true,
        data: updatedCombined,
        message: "Tax settings saved successfully.",
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to save tax settings",
      };
    }
  },

  getSlabs: async (search?: string): Promise<TaxSettingsActionResult<ProfessionalTaxSlab[]>> => {
    try {
      const res = await apiClient.get<unknown>(API_ENDPOINTS.ptSlabs.list(search));
      const slabs = asPtSlabsList(res);
      return {
        ok: true,
        data: slabs,
        message: "PT slabs retrieved successfully.",
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to fetch PT slabs",
      };
    }
  },

  createSlab: async (
    payload: Omit<ProfessionalTaxSlab, "id">,
  ): Promise<TaxSettingsActionResult<ProfessionalTaxSlab>> => {
    try {
      const body: PtSlabCreatePayload = {
        from_amount: Number(payload.from_amount) || 0,
        to_amount: payload.to_amount === null || payload.to_amount === undefined ? null : Number(payload.to_amount),
        tax_amount: Number(payload.tax_amount) || 0,
      };

      const res = await apiClient.post<unknown>(API_ENDPOINTS.ptSlabs.create, body);
      const parsed = asPtSlabsList(res)[0];
      const createdSlab: ProfessionalTaxSlab = parsed || {
        id: "0",
        from_amount: body.from_amount,
        to_amount: body.to_amount,
        tax_amount: body.tax_amount,
      };

      return {
        ok: true,
        data: createdSlab,
        message: "Professional tax slab created successfully.",
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to create PT slab",
      };
    }
  },

  updateSlab: async (
    id: string,
    payload: Omit<ProfessionalTaxSlab, "id">,
  ): Promise<TaxSettingsActionResult<ProfessionalTaxSlab>> => {
    try {
      const body: PtSlabUpdatePayload = {
        from_amount: Number(payload.from_amount) || 0,
        to_amount: payload.to_amount === null || payload.to_amount === undefined ? null : Number(payload.to_amount),
        tax_amount: Number(payload.tax_amount) || 0,
        srl_no: Number(id) || undefined,
      };

      const res = await apiClient.put<unknown>(API_ENDPOINTS.ptSlabs.update(id), body);
      const parsed = asPtSlabsList(res)[0];
      const updatedSlab: ProfessionalTaxSlab = parsed || {
        id,
        from_amount: body.from_amount,
        to_amount: body.to_amount,
        tax_amount: body.tax_amount,
      };

      return {
        ok: true,
        data: updatedSlab,
        message: "Professional tax slab updated successfully.",
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to update PT slab",
      };
    }
  },

  removeSlab: async (id: string): Promise<TaxSettingsActionResult<null>> => {
    try {
      await apiClient.delete<unknown>(API_ENDPOINTS.ptSlabs.delete(id));
      return {
        ok: true,
        data: null,
        message: "Professional tax slab deleted successfully.",
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to delete PT slab",
      };
    }
  },
};
