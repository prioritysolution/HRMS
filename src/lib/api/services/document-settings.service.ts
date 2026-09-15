import { MOCK_DOCUMENT_SETTINGS, type DocumentSettings } from "@/data/settings-mock";

export type DocumentSettingsActionResult<T> = {
  ok: boolean;
  data?: T;
  message: string;
};

function cloneSettings(source: DocumentSettings): DocumentSettings {
  return { ...source };
}

/** In-memory demo store until Document Settings API is available. */
let settingsStore = cloneSettings(MOCK_DOCUMENT_SETTINGS);

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toFlag(value: unknown): 0 | 1 {
  return String(value ?? "").trim() === "0" ? 0 : 1;
}

export const documentSettingsService = {
  get: async (): Promise<DocumentSettingsActionResult<DocumentSettings>> => {
    await delay();
    return {
      ok: true,
      data: cloneSettings(settingsStore),
      message: "Document settings loaded (demo).",
    };
  },

  update: async (
    payload: DocumentSettings,
  ): Promise<DocumentSettingsActionResult<DocumentSettings>> => {
    await delay();
    settingsStore = cloneSettings({
      approval_required: toFlag(payload.approval_required),
      allow_edit_after_approval: toFlag(payload.allow_edit_after_approval),
      allow_cancel_after_approval: toFlag(payload.allow_cancel_after_approval),
      allow_reprint: toFlag(payload.allow_reprint),
      show_duplicate_on_reprint: toFlag(payload.show_duplicate_on_reprint),
    });
    return {
      ok: true,
      data: cloneSettings(settingsStore),
      message: "Document settings saved (demo).",
    };
  },
};
