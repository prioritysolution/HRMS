import { MOCK_ATTENDANCE_SETTINGS, type AttendanceSettings } from "@/data/settings-mock";

export type AttendanceSettingsActionResult<T> = {
  ok: boolean;
  data?: T;
  message: string;
};

function cloneSettings(source: AttendanceSettings): AttendanceSettings {
  return { ...source };
}

/** In-memory demo store until Attendance Settings API is available. */
let settingsStore = cloneSettings(MOCK_ATTENDANCE_SETTINGS);

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

export const attendanceSettingsService = {
  get: async (): Promise<AttendanceSettingsActionResult<AttendanceSettings>> => {
    await delay();
    return {
      ok: true,
      data: cloneSettings(settingsStore),
      message: "Attendance settings loaded (demo).",
    };
  },

  update: async (
    payload: AttendanceSettings,
  ): Promise<AttendanceSettingsActionResult<AttendanceSettings>> => {
    await delay();
    settingsStore = cloneSettings({
      late_grace_period_minutes: toPositiveNumber(
        payload.late_grace_period_minutes,
        settingsStore.late_grace_period_minutes,
      ),
      early_leaving_grace_minutes: toPositiveNumber(
        payload.early_leaving_grace_minutes,
        settingsStore.early_leaving_grace_minutes,
      ),
      late_mark_after_minutes: toPositiveNumber(
        payload.late_mark_after_minutes,
        settingsStore.late_mark_after_minutes,
      ),
      half_day_after_minutes: toPositiveNumber(
        payload.half_day_after_minutes,
        settingsStore.half_day_after_minutes,
      ),
      absent_after_minutes: toPositiveNumber(
        payload.absent_after_minutes,
        settingsStore.absent_after_minutes,
      ),
      overtime_applicable: toFlag(payload.overtime_applicable),
      ot_calculation: payload.ot_calculation === "monthly" ? "monthly" : "daily",
      minimum_ot_minutes: toPositiveNumber(
        payload.minimum_ot_minutes,
        settingsStore.minimum_ot_minutes,
      ),
      ot_round_off_minutes: toPositiveNumber(
        payload.ot_round_off_minutes,
        settingsStore.ot_round_off_minutes,
      ),
      ot_requires_approval: toFlag(payload.ot_requires_approval),
      maximum_ot_per_day_hours: toPositiveNumber(
        payload.maximum_ot_per_day_hours,
        settingsStore.maximum_ot_per_day_hours,
      ),
      holiday_ot: toFlag(payload.holiday_ot),
      weekly_off_ot: toFlag(payload.weekly_off_ot),
    });
    return {
      ok: true,
      data: cloneSettings(settingsStore),
      message: "Attendance settings saved (demo).",
    };
  },
};
