import { appendOrgIdQuery, getCurrentOrgId, resolveOrgId } from "@/lib/auth/org-context";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
    HolidayCalendarEntry,
    HolidayCalendarQuery,
    HolidayCalendarResponse,
    HolidayListQuery,
    HolidayRecord,
    HolidayWritePayload,
} from "@/lib/api/types";
import type { HrmsRow } from "@/types/hrms";

/** Appl-options Opt_Grp_Id = 17 — Holiday Type / Purpose */
export const HOLIDAY_TYPE_OPT_GRP_ID = 17;

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    return value as Record<string, unknown>;
}

function getList(payload: unknown): HolidayRecord[] {
    if (Array.isArray(payload)) {
        return payload as HolidayRecord[];
    }

    const record = asRecord(payload);

    if (!record) {
        return [];
    }

    if (Array.isArray(record.data)) {
        return record.data as HolidayRecord[];
    }

    return [];
}

function getSingle(payload: unknown): HolidayRecord {
    const record = asRecord(payload);

    if (record?.data && typeof record.data === "object") {
        return record.data as HolidayRecord;
    }

    return payload as HolidayRecord;
}

function buildListUrl(query?: HolidayListQuery): string {
    const params = new URLSearchParams();

    const orgId = query?.org_id ?? getCurrentOrgId();
    if (orgId !== undefined) {
        params.set("org_id", String(orgId));
    }

    if (query?.holiday_id !== undefined) {
        params.set("holiday_id", String(query.holiday_id));
    }

    if (query?.month_sl !== undefined) {
        params.set("month_sl", String(query.month_sl));
    }

    if (query?.year_sl !== undefined) {
        params.set("year_sl", String(query.year_sl));
    }

    if (query?.holiday_type) {
        params.set("holiday_type", query.holiday_type);
    }

    if (query?.holiday_date) {
        params.set("holiday_date", query.holiday_date);
    }

    const queryString = params.toString();

    return queryString
        ? `${API_ENDPOINTS.holiday.list}?${queryString}`
        : API_ENDPOINTS.holiday.list;
}

function normalizeDate(value: unknown): string {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value).trim();
}

function readText(source: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
        const value = source[key];
        if (value === undefined || value === null) continue;
        const text = String(value).trim();
        if (text) return text;
    }
    return "";
}

function optionalNumber(value: unknown): number | null {
    if (value === undefined || value === null || value === "") return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
}

function toFlag(value: unknown): number {
    if (value === true || value === 1 || value === "1" || value === "Yes") return 1;
    return 0;
}

function normalizeCalendarEntry(value: unknown): HolidayCalendarEntry | null {
    const source = asRecord(value);
    if (!source) return null;

    const holidayId = optionalNumber(source.Holiday_id ?? source.holiday_id);
    const holidayDate = readText(source, ["Holiday_date", "holiday_date"]);
    const holidayName = readText(source, ["Holiday_name", "holiday_name"]);
    if (!holidayId || !holidayDate || !holidayName) return null;

    return {
        Holiday_id: holidayId,
        Fin_Year: optionalNumber(source.Fin_Year ?? source.fin_year),
        Month_sl: optionalNumber(source.Month_sl ?? source.month_sl),
        Year_Sl: optionalNumber(source.Year_Sl ?? source.year_sl),
        Holiday_date: holidayDate,
        Holiday_name: holidayName,
        Holiday_type:
            optionalNumber(source.Holiday_type ?? source.holiday_type) ??
            (readText(source, ["Holiday_type", "holiday_type"]) || null),
        Holiday_type_code:
            optionalNumber(source.Holiday_type_code ?? source.holiday_type_code),
        Holiday_type_name:
            readText(source, ["Holiday_type_name", "holiday_type_name"]) || null,
        Day_label: readText(source, ["Day_label", "day_label"]) || null,
        Month_name: readText(source, ["Month_name", "month_name"]) || null,
        Is_upcoming: toFlag(source.Is_upcoming ?? source.is_upcoming),
        Is_next: toFlag(source.Is_next ?? source.is_next),
        Remarks: readText(source, ["Remarks", "remarks"]) || null,
    };
}

function asHolidayCalendar(payload: unknown): HolidayCalendarResponse {
    const root = asRecord(payload);
    const nested = root ? asRecord(root.data) ?? root : null;
    const source = nested ?? {};

    const calendarRaw = source.calendar ?? source.Calendar;
    const upcomingRaw = source.upcoming ?? source.Upcoming;

    const calendar = Array.isArray(calendarRaw)
        ? calendarRaw
              .map(normalizeCalendarEntry)
              .filter((item): item is HolidayCalendarEntry => item !== null)
        : [];
    const upcoming = Array.isArray(upcomingRaw)
        ? upcomingRaw
              .map(normalizeCalendarEntry)
              .filter((item): item is HolidayCalendarEntry => item !== null)
        : [];

    const year =
        optionalNumber(source.year ?? source.Year ?? source.Year_Sl) ??
        optionalNumber(calendar[0]?.Year_Sl) ??
        new Date().getFullYear();
    const month =
        optionalNumber(source.month ?? source.Month ?? source.Month_sl) ??
        optionalNumber(calendar[0]?.Month_sl) ??
        new Date().getMonth() + 1;

    return {
        year,
        month,
        month_name:
            readText(source, ["month_name", "Month_name"]) ||
            new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long" }),
        month_start: readText(source, ["month_start", "Month_start"]) || null,
        month_end: readText(source, ["month_end", "Month_end"]) || null,
        as_of_date: readText(source, ["as_of_date", "As_of_date"]) || null,
        calendar,
        upcoming,
    };
}

function buildCalendarUrl(query: HolidayCalendarQuery): string {
    const params = new URLSearchParams();
    params.set("year_sl", String(query.year_sl));
    params.set("month_sl", String(query.month_sl));
    return `${API_ENDPOINTS.holiday.calendar}?${params.toString()}`;
}

function holidayToRow(
    holiday: HolidayRecord,
    fallback?: HrmsRow,
): HrmsRow {
    const source = holiday as HolidayRecord & Record<string, unknown>;
    const typeCode = readText(source, ["Holiday_type", "holiday_type"]);
    const typeName = readText(source, [
        "Holiday_type_name",
        "holiday_type_name",
        "Purpose_name",
        "purpose_name",
    ]);
    const purposeRaw = readText(source, ["Purpose", "purpose"]);
    // Prefer type name for display; avoid showing numeric type codes in Purpose.
    const purpose =
        typeName ||
        (purposeRaw && purposeRaw !== typeCode ? purposeRaw : "") ||
        (typeCode && !/^\d+$/.test(typeCode) ? typeCode : "") ||
        String(fallback?.Purpose ?? "").trim() ||
        typeCode;
    const holidayDate = normalizeDate(holiday.Holiday_date ?? fallback?.Holiday_date);
    const holidayName = String(holiday.Holiday_name ?? fallback?.Holiday_name ?? "");
    const finYearId =
        optionalNumber(source.Fin_Year ?? source.fin_year ?? source.Year_Id ?? source.year_id) ??
        optionalNumber(fallback?.Fin_year ?? fallback?.Fin_Year ?? fallback?.Year_Id) ??
        0;
    const financialYearName =
        readText(source, ["Financial_year", "financial_year", "Year_Name", "year_name"]) ||
        String(fallback?.Financial_year ?? "").trim();

    return {
        id: String(holiday.Holiday_id ?? fallback?.id ?? ""),

        Holiday_id: holiday.Holiday_id,

        Month_sl: holiday.Month_sl,

        Year_Sl: holiday.Year_Sl,

        Holiday_date: holidayDate,

        Holiday_name: holidayName,

        Holiday_type: typeCode || String(fallback?.Holiday_type ?? ""),

        Holiday_type_name: typeName || purpose,

        Fin_Year: finYearId || "",
        Fin_year: finYearId ? String(finYearId) : "",
        Year_Id: finYearId || "",
        Financial_year: financialYearName || (finYearId ? String(finYearId) : ""),

        Purpose: purpose,

        Remarks: "",
    };
}

function rowToPayload(
    row: HrmsRow,
    includeDerivedFields = false,
): HolidayWritePayload {
    const holidayDate = String(
        row.Holiday_date ?? "",
    ).trim();

    const finYear =
        optionalNumber(row.Fin_year ?? row.Fin_Year ?? row.Year_Id) ?? undefined;

    const payload: HolidayWritePayload = {
        org_id: resolveOrgId(row.Org_Id),
        holiday_date: holidayDate,

        holiday_name: String(
            row.Holiday_name ?? "",
        ).trim(),

        // Form Purpose select stores Opt_Code; keep that as holiday_type.
        holiday_type: String(
            row.Holiday_type || row.Purpose || "",
        ).trim(),

        ...(finYear ? { fin_year: finYear } : {}),
    };

    if (includeDerivedFields && holidayDate) {
        const date = new Date(`${holidayDate}T00:00:00`);

        if (!Number.isNaN(date.getTime())) {
            payload.month_sl = date.getMonth() + 1;
            payload.year_sl = date.getFullYear();
        }
    }

    return payload;
}

export const holidayService = {
    list: async (
        query?: HolidayListQuery,
    ): Promise<HrmsRow[]> => {
        const payload = await apiClient.get<unknown>(
            buildListUrl(query),
        );

        return getList(payload).map((holiday) => holidayToRow(holiday));
    },

    calendar: async (
        query: HolidayCalendarQuery,
    ): Promise<HolidayCalendarResponse> => {
        const payload = await apiClient.get<unknown>(buildCalendarUrl(query));
        return asHolidayCalendar(payload);
    },

    getById: async (
        id: string | number,
    ): Promise<HrmsRow> => {
        const payload = await apiClient.get<unknown>(
            API_ENDPOINTS.holiday.get(id),
        );

        return holidayToRow(
            getList(payload)[0] ??
            getSingle(payload),
        );
    },

    create: async (
        row: HrmsRow,
    ): Promise<HrmsRow> => {
        const payload = await apiClient.post<unknown>(
            API_ENDPOINTS.holiday.create,
            rowToPayload(row, false),
        );

        return holidayToRow(
            getSingle(payload),
            row,
        );
    },

    update: async (
        id: string | number,
        row: HrmsRow,
    ): Promise<HrmsRow> => {
        const payload = await apiClient.put<unknown>(
            API_ENDPOINTS.holiday.update(id),
            rowToPayload(row, true),
        );

        return holidayToRow(
            getSingle(payload),
            row,
        );
    },

    remove: async (
        id: string | number,
    ) => {
        return apiClient.delete<{
            success?: boolean;
            message?: string;
            data?: null;
        }>(
            appendOrgIdQuery(API_ENDPOINTS.holiday.delete(id)),
            {
                unwrap: false,
            },
        );
    },
};