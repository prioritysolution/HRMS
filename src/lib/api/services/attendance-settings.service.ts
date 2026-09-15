import { apiClient, isSoftApiError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  AttendanceSettingsRecord,
  LateEarlyRulesWritePayload,
  OvertimeSettingsWritePayload,
} from "@/lib/api/types";

const SOFT_REQUEST = { throwOnError: false } as const;

/** OT Calculation — GET /api/v1/appl-options/list?opt_grp_id=23 */
export const OT_CALCULATION_OPT_GRP_ID = 23;

export type AttendanceSettings = AttendanceSettingsRecord;

export type AttendanceSettingsActionResult<T> = {
  ok: boolean;
  data?: T;
  message: string;
  empty?: boolean;
  missingRoute?: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickFirst(payload: unknown): Record<string, unknown> {
  if (Array.isArray(payload)) return asRecord(payload[0]) ?? {};
  const record = asRecord(payload);
  if (!record) return {};
  if (Array.isArray(record.data)) return asRecord(record.data[0]) ?? {};
  const nested = asRecord(record.data);
  if (nested) {
    if (Array.isArray(nested.data)) return asRecord(nested.data[0]) ?? {};
    return nested;
  }
  return record;
}

function readValue(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function asText(value: unknown): string {
  if (value === undefined || value === null || value === false) return "";
  return String(value).trim();
}

function toFlag(value: unknown, fallback: 0 | 1 = 0): 0 | 1 {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value ? 1 : 0;
  const text = String(value).trim().toLowerCase();
  if (["0", "false", "no", "n", "off"].includes(text)) return 0;
  if (["1", "true", "yes", "y", "on"].includes(text)) return 1;
  const numeric = Number(text);
  if (Number.isFinite(numeric)) return numeric === 0 ? 0 : 1;
  return fallback;
}

/** Returns undefined when the key is absent so callers can keep prior/submitted values. */
function readFlag(
  source: Record<string, unknown>,
  keys: string[],
): 0 | 1 | undefined {
  const raw = readValue(source, keys);
  if (raw === undefined || raw === null || raw === "") return undefined;
  return toFlag(raw, 0);
}

function readNumber(
  source: Record<string, unknown>,
  keys: string[],
): number | undefined {
  const raw = readValue(source, keys);
  if (raw === undefined || raw === null || raw === "") return undefined;
  const numeric = Number(raw);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : undefined;
}

function toPositiveNumber(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
}

function isMissingRoute(status: number, message: string, payload?: unknown): boolean {
  if (status === 404 || status === 405) return true;
  const exception = asText(asRecord(payload)?.exception);
  return /could not be found/i.test(message) || exception.includes("NotFoundHttpException");
}

function toUserMessage(
  status: number,
  message: string,
  action: "load" | "save",
): string {
  if (isMissingRoute(status, message)) {
    return action === "load"
      ? "Could not load attendance settings. The attendance settings API is not available yet."
      : "Could not save attendance settings. The attendance settings API is not available yet.";
  }
  if (status === 408 || /timed out/i.test(message)) {
    return "Request timed out. Please try again.";
  }
  if (status === 0 || /network error/i.test(message)) {
    return "Network error. Check your API connection.";
  }
  return message || "Something went wrong. Please try again.";
}

function fail<T>(
  action: "load" | "save",
  status: number,
  message: string,
  payload?: unknown,
): AttendanceSettingsActionResult<T> {
  return {
    ok: false,
    message: toUserMessage(status, message, action),
    missingRoute: isMissingRoute(status, message, payload),
  };
}

function emptySettings(): AttendanceSettings {
  return {
    late_grace_period_minutes: 15,
    early_leaving_grace_minutes: 15,
    late_mark_after_minutes: 15,
    half_day_after_minutes: 120,
    absent_after_minutes: 240,
    overtime_applicable: 0,
    ot_calculation: "",
    ot_calculation_name: "",
    minimum_ot_minutes: 30,
    ot_round_off_minutes: 30,
    ot_requires_approval: 0,
    maximum_ot_per_day_hours: 4,
    holiday_ot: 0,
    weekly_off_ot: 0,
  };
}

function envelopeMessage(payload: unknown, fallback: string): string {
  return asText(asRecord(payload)?.message) || fallback;
}

function asLateEarly(payload: unknown): Partial<AttendanceSettings> {
  const source = pickFirst(payload);
  if (Object.keys(source).length === 0) return {};

  const next: Partial<AttendanceSettings> = {};
  const lateGrace = readNumber(source, [
    "Late_Grace_Minutes",
    "late_grace_minutes",
    "Late_Grace_Period_Minutes",
    "late_grace_period_minutes",
  ]);
  const earlyGrace = readNumber(source, [
    "Early_Leaving_Grace_Minutes",
    "early_leaving_grace_minutes",
  ]);
  const lateMark = readNumber(source, [
    "Late_Mark_After_Minutes",
    "late_mark_after_minutes",
  ]);
  const halfDay = readNumber(source, [
    "Half_Day_After_Minutes",
    "half_day_after_minutes",
  ]);
  const absent = readNumber(source, [
    "Absent_After_Minutes",
    "absent_after_minutes",
  ]);

  if (lateGrace !== undefined) next.late_grace_period_minutes = lateGrace;
  if (earlyGrace !== undefined) next.early_leaving_grace_minutes = earlyGrace;
  if (lateMark !== undefined) next.late_mark_after_minutes = lateMark;
  if (halfDay !== undefined) next.half_day_after_minutes = halfDay;
  if (absent !== undefined) next.absent_after_minutes = absent;
  return next;
}

function asOvertime(payload: unknown): Partial<AttendanceSettings> {
  const source = pickFirst(payload);
  if (Object.keys(source).length === 0) return {};

  const next: Partial<AttendanceSettings> = {};

  const overtimeApplicable = readFlag(source, [
    "Overtime_Applicable",
    "overtime_applicable",
    "Is_Overtime_Applicable",
    "OT_Applicable",
    "Ot_Applicable",
  ]);
  const otRequiresApproval = readFlag(source, [
    "Ot_Requires_Approval",
    "OT_Requires_Approval",
    "ot_requires_approval",
    "Is_Ot_Requires_Approval",
  ]);
  const holidayOt = readFlag(source, [
    "Holiday_Ot",
    "Holiday_OT",
    "holiday_ot",
    "Is_Holiday_Ot",
  ]);
  const weeklyOffOt = readFlag(source, [
    "Weekly_Off_Ot",
    "Weekly_Off_OT",
    "weekly_off_ot",
    "Is_Weekly_Off_Ot",
  ]);
  const otCalculation = asText(
    readValue(source, ["Ot_Calculation", "OT_Calculation", "ot_calculation"]),
  );
  const otCalculationName = asText(
    readValue(source, [
      "Ot_Calculation_Name",
      "OT_Calculation_Name",
      "ot_calculation_name",
    ]),
  );
  const minOt = readNumber(source, [
    "Min_Ot_Minutes",
    "min_ot_minutes",
    "Minimum_Ot_Minutes",
    "minimum_ot_minutes",
  ]);
  const roundOff = readNumber(source, [
    "Ot_Round_Off_Minutes",
    "OT_Round_Off_Minutes",
    "ot_round_off_minutes",
  ]);
  const maxOt = readNumber(source, [
    "Max_Ot_Per_Day_Hours",
    "max_ot_per_day_hours",
    "Maximum_Ot_Per_Day_Hours",
    "maximum_ot_per_day_hours",
  ]);

  if (overtimeApplicable !== undefined) next.overtime_applicable = overtimeApplicable;
  if (otRequiresApproval !== undefined) next.ot_requires_approval = otRequiresApproval;
  if (holidayOt !== undefined) next.holiday_ot = holidayOt;
  if (weeklyOffOt !== undefined) next.weekly_off_ot = weeklyOffOt;
  if (otCalculation) next.ot_calculation = otCalculation;
  if (otCalculationName) next.ot_calculation_name = otCalculationName;
  if (minOt !== undefined) next.minimum_ot_minutes = minOt;
  if (roundOff !== undefined) next.ot_round_off_minutes = roundOff;
  if (maxOt !== undefined) next.maximum_ot_per_day_hours = maxOt;
  return next;
}

export const attendanceSettingsService = {
  get: async (): Promise<AttendanceSettingsActionResult<AttendanceSettings>> => {
    const [latePayload, otPayload] = await Promise.all([
      apiClient.get<unknown>(API_ENDPOINTS.lateEarlyRules.list, SOFT_REQUEST),
      apiClient.get<unknown>(API_ENDPOINTS.overtimeSettings.list, SOFT_REQUEST),
    ]);

    if (isSoftApiError(latePayload) && isSoftApiError(otPayload)) {
      return {
        ...fail("load", latePayload.status, latePayload.message, latePayload.data),
        data: emptySettings(),
      };
    }
    if (latePayload === undefined || otPayload === undefined) {
      return fail("load", 401, "Your session expired. Please sign in again.");
    }

    const lateError = isSoftApiError(latePayload) ? latePayload : null;
    const otError = isSoftApiError(otPayload) ? otPayload : null;

    const latePart = lateError ? {} : asLateEarly(latePayload);
    const otPart = otError ? {} : asOvertime(otPayload);
    const data: AttendanceSettings = {
      ...emptySettings(),
      ...latePart,
      ...otPart,
    };

    if (lateError && !otError) {
      return {
        ok: false,
        data,
        message: toUserMessage(lateError.status, lateError.message, "load"),
        missingRoute: isMissingRoute(lateError.status, lateError.message, lateError.data),
      };
    }
    if (otError && !lateError) {
      return {
        ok: false,
        data,
        message: toUserMessage(otError.status, otError.message, "load"),
        missingRoute: isMissingRoute(otError.status, otError.message, otError.data),
      };
    }

    const lateEmpty = Object.keys(pickFirst(latePayload)).length === 0;
    const otEmpty = Object.keys(pickFirst(otPayload)).length === 0;

    return {
      ok: true,
      data,
      empty: lateEmpty && otEmpty,
      message:
        envelopeMessage(latePayload, "") ||
        envelopeMessage(otPayload, "") ||
        "Attendance settings loaded.",
    };
  },

  update: async (
    input: AttendanceSettings,
  ): Promise<AttendanceSettingsActionResult<AttendanceSettings>> => {
    const lateBody: LateEarlyRulesWritePayload = {
      late_grace_minutes: toPositiveNumber(input.late_grace_period_minutes, 15),
      early_leaving_grace_minutes: toPositiveNumber(
        input.early_leaving_grace_minutes,
        15,
      ),
      late_mark_after_minutes: toPositiveNumber(input.late_mark_after_minutes, 15),
      half_day_after_minutes: toPositiveNumber(input.half_day_after_minutes, 120),
      absent_after_minutes: toPositiveNumber(input.absent_after_minutes, 240),
    };

    const otBody: OvertimeSettingsWritePayload = {
      overtime_applicable: toFlag(input.overtime_applicable, 0),
      ot_requires_approval: toFlag(input.ot_requires_approval, 0),
      holiday_ot: toFlag(input.holiday_ot, 0),
      weekly_off_ot: toFlag(input.weekly_off_ot, 0),
      // API expects Opt_Code (not Option_Id).
      ot_calculation: asText(input.ot_calculation),
      min_ot_minutes: toPositiveNumber(input.minimum_ot_minutes, 30),
      ot_round_off_minutes: toPositiveNumber(input.ot_round_off_minutes, 30),
      max_ot_per_day_hours: toPositiveNumber(input.maximum_ot_per_day_hours, 4),
    };

    const [latePayload, otPayload] = await Promise.all([
      apiClient.put<unknown>(
        API_ENDPOINTS.lateEarlyRules.save,
        lateBody,
        SOFT_REQUEST,
      ),
      apiClient.put<unknown>(
        API_ENDPOINTS.overtimeSettings.save,
        otBody,
        SOFT_REQUEST,
      ),
    ]);

    if (isSoftApiError(latePayload)) {
      return fail("save", latePayload.status, latePayload.message, latePayload.data);
    }
    if (isSoftApiError(otPayload)) {
      return fail("save", otPayload.status, otPayload.message, otPayload.data);
    }
    if (latePayload === undefined || otPayload === undefined) {
      return fail("save", 401, "Your session expired. Please sign in again.");
    }

    const lateMapped = asLateEarly(latePayload);
    const otMapped = asOvertime(otPayload);

    // Prefer submitted values after a successful save; overlay only fields the API returned.
    const data: AttendanceSettings = {
      late_grace_period_minutes:
        lateMapped.late_grace_period_minutes ?? lateBody.late_grace_minutes,
      early_leaving_grace_minutes:
        lateMapped.early_leaving_grace_minutes ??
        lateBody.early_leaving_grace_minutes,
      late_mark_after_minutes:
        lateMapped.late_mark_after_minutes ?? lateBody.late_mark_after_minutes,
      half_day_after_minutes:
        lateMapped.half_day_after_minutes ?? lateBody.half_day_after_minutes,
      absent_after_minutes:
        lateMapped.absent_after_minutes ?? lateBody.absent_after_minutes,
      overtime_applicable:
        otMapped.overtime_applicable ?? otBody.overtime_applicable,
      ot_requires_approval:
        otMapped.ot_requires_approval ?? otBody.ot_requires_approval,
      holiday_ot: otMapped.holiday_ot ?? otBody.holiday_ot,
      weekly_off_ot: otMapped.weekly_off_ot ?? otBody.weekly_off_ot,
      ot_calculation: otMapped.ot_calculation || otBody.ot_calculation,
      ot_calculation_name: otMapped.ot_calculation_name || "",
      minimum_ot_minutes: otMapped.minimum_ot_minutes ?? otBody.min_ot_minutes,
      ot_round_off_minutes:
        otMapped.ot_round_off_minutes ?? otBody.ot_round_off_minutes,
      maximum_ot_per_day_hours:
        otMapped.maximum_ot_per_day_hours ?? otBody.max_ot_per_day_hours,
    };

    return {
      ok: true,
      data,
      message:
        envelopeMessage(latePayload, "") ||
        envelopeMessage(otPayload, "") ||
        "Attendance settings saved.",
    };
  },
};
