import { MOCK_LEAVE_SETTINGS, type LeaveSettings } from "@/data/settings-mock";

export type LeaveSettingsActionResult<T> = {
  ok: boolean;
  data?: T;
  message: string;
};

function cloneSettings(source: LeaveSettings): LeaveSettings {
  return { ...source };
}

/** In-memory demo store until Leave Settings API is available. */
let settingsStore = cloneSettings(MOCK_LEAVE_SETTINGS);

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toFlag(value: unknown): 0 | 1 {
  return String(value ?? "").trim() === "0" ? 0 : 1;
}

export const leaveSettingsService = {
  get: async (): Promise<LeaveSettingsActionResult<LeaveSettings>> => {
    await delay();
    return {
      ok: true,
      data: cloneSettings(settingsStore),
      message: "Leave settings loaded (demo).",
    };
  },

  update: async (
    payload: LeaveSettings,
  ): Promise<LeaveSettingsActionResult<LeaveSettings>> => {
    await delay();
    settingsStore = cloneSettings({
      apply_for_future_leave: toFlag(payload.apply_for_future_leave),
      apply_for_previous_date_leave: toFlag(payload.apply_for_previous_date_leave),
      half_day_leave_allowed: toFlag(payload.half_day_leave_allowed),
      apply_during_probation: toFlag(payload.apply_during_probation),
      reason_mandatory: toFlag(payload.reason_mandatory),
      prevent_overlapping_leave: toFlag(payload.prevent_overlapping_leave),
    });
    return {
      ok: true,
      data: cloneSettings(settingsStore),
      message: "Leave settings saved (demo).",
    };
  },
};
