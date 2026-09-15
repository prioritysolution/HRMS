import {
  MOCK_TAX_SETTINGS,
  type ProfessionalTaxSlab,
  type TaxSettings,
} from "@/data/settings-mock";

export type TaxSettingsActionResult<T> = {
  ok: boolean;
  data?: T;
  message: string;
};

function cloneSlabs(slabs: ProfessionalTaxSlab[]): ProfessionalTaxSlab[] {
  return slabs.map((slab) => ({ ...slab }));
}

function cloneSettings(source: TaxSettings): TaxSettings {
  return {
    ...source,
    pt_slabs: cloneSlabs(source.pt_slabs),
  };
}

/** In-memory demo store until Tax Settings API is available. */
let settingsStore = cloneSettings(MOCK_TAX_SETTINGS);
let nextSlabId =
  settingsStore.pt_slabs.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1;

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

function asDeductionFrequency(value: unknown): TaxSettings["pt_deduction_frequency"] {
  const text = String(value ?? "").trim();
  if (text === "half_yearly" || text === "yearly") return text;
  return "monthly";
}

function asPtBasedOn(value: unknown): TaxSettings["pt_based_on"] {
  return String(value ?? "").trim() === "basic" ? "basic" : "gross";
}

function asTaxRegime(value: unknown): TaxSettings["tax_regime"] {
  return String(value ?? "").trim() === "old" ? "old" : "new";
}

function asTdsMethod(value: unknown): TaxSettings["tds_calculation_method"] {
  return String(value ?? "").trim() === "actual" ? "actual" : "monthly_projection";
}

export const taxSettingsService = {
  get: async (): Promise<TaxSettingsActionResult<TaxSettings>> => {
    await delay();
    return {
      ok: true,
      data: cloneSettings(settingsStore),
      message: "Tax settings loaded (demo).",
    };
  },

  update: async (payload: TaxSettings): Promise<TaxSettingsActionResult<TaxSettings>> => {
    await delay();
    settingsStore = cloneSettings({
      pt_applicable: toFlag(payload.pt_applicable),
      pt_state: String(payload.pt_state ?? "").trim() || settingsStore.pt_state,
      pt_deduction_frequency: asDeductionFrequency(payload.pt_deduction_frequency),
      pt_based_on: asPtBasedOn(payload.pt_based_on),
      pt_slabs: cloneSlabs(payload.pt_slabs ?? settingsStore.pt_slabs),
      tds_applicable: toFlag(payload.tds_applicable),
      tax_regime: asTaxRegime(payload.tax_regime),
      financial_year:
        String(payload.financial_year ?? "").trim() || settingsStore.financial_year,
      tds_calculation_method: asTdsMethod(payload.tds_calculation_method),
      standard_deduction: toPositiveNumber(
        payload.standard_deduction,
        settingsStore.standard_deduction,
      ),
      round_off_tds: toFlag(payload.round_off_tds),
      consider_previous_employment: toFlag(payload.consider_previous_employment),
      auto_generate_form16: toFlag(payload.auto_generate_form16),
      show_tds_on_payslip: toFlag(payload.show_tds_on_payslip),
    });
    return {
      ok: true,
      data: cloneSettings(settingsStore),
      message: "Tax settings saved (demo).",
    };
  },

  createSlab: async (
    payload: Omit<ProfessionalTaxSlab, "id">,
  ): Promise<TaxSettingsActionResult<ProfessionalTaxSlab>> => {
    await delay();
    const created: ProfessionalTaxSlab = {
      id: String(nextSlabId++),
      from_amount: toPositiveNumber(payload.from_amount, 0),
      to_amount:
        payload.to_amount === null || payload.to_amount === undefined
          ? null
          : toPositiveNumber(payload.to_amount, 0),
      tax_amount: toPositiveNumber(payload.tax_amount, 0),
    };
    settingsStore = {
      ...settingsStore,
      pt_slabs: [...settingsStore.pt_slabs, created],
    };
    return {
      ok: true,
      data: { ...created },
      message: "Professional tax slab added (demo).",
    };
  },

  updateSlab: async (
    id: string,
    payload: Omit<ProfessionalTaxSlab, "id">,
  ): Promise<TaxSettingsActionResult<ProfessionalTaxSlab>> => {
    await delay();
    const index = settingsStore.pt_slabs.findIndex((row) => row.id === id);
    if (index < 0) {
      return { ok: false, message: "PT slab not found." };
    }
    const updated: ProfessionalTaxSlab = {
      id,
      from_amount: toPositiveNumber(payload.from_amount, 0),
      to_amount:
        payload.to_amount === null || payload.to_amount === undefined
          ? null
          : toPositiveNumber(payload.to_amount, 0),
      tax_amount: toPositiveNumber(payload.tax_amount, 0),
    };
    settingsStore = {
      ...settingsStore,
      pt_slabs: settingsStore.pt_slabs.map((row) => (row.id === id ? updated : row)),
    };
    return {
      ok: true,
      data: { ...updated },
      message: "Professional tax slab updated (demo).",
    };
  },

  removeSlab: async (id: string): Promise<TaxSettingsActionResult<null>> => {
    await delay();
    if (!settingsStore.pt_slabs.some((row) => row.id === id)) {
      return { ok: false, message: "PT slab not found." };
    }
    settingsStore = {
      ...settingsStore,
      pt_slabs: settingsStore.pt_slabs.filter((row) => row.id !== id),
    };
    return {
      ok: true,
      data: null,
      message: "Professional tax slab deleted (demo).",
    };
  },
};
