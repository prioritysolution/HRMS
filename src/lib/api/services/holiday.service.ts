import { appendOrgIdQuery, getCurrentOrgId, resolveOrgId } from "@/lib/auth/org-context";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
    HolidayListQuery,
    HolidayRecord,
    HolidayWritePayload,
} from "@/lib/api/types";
import { lookupHolidayDescription } from "@/data/holiday-remarks";
import type { HrmsRow } from "@/types/hrms";

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

function holidayToRow(
    holiday: HolidayRecord,
    fallback?: HrmsRow,
): HrmsRow {
    const source = holiday as HolidayRecord & Record<string, unknown>;
    const purpose = readText(source, ["Purpose", "purpose", "Holiday_type", "holiday_type"]);
    const holidayDate = normalizeDate(holiday.Holiday_date ?? fallback?.Holiday_date);
    const holidayName = String(holiday.Holiday_name ?? fallback?.Holiday_name ?? "");
    const remarks = readText(source, [
        "Remarks",
        "remarks",
        "Remark",
        "remark",
        "Description",
        "description",
        "holiday_description",
        "Holiday_description",
        "holiday_remarks",
        "Holiday_remarks",
    ]) || String(fallback?.Remarks ?? "").trim() || lookupHolidayDescription(holidayDate, holidayName);

    return {
        id: String(holiday.Holiday_id ?? fallback?.id ?? ""),

        Holiday_id: holiday.Holiday_id,

        Month_sl: holiday.Month_sl,

        Year_Sl: holiday.Year_Sl,

        Holiday_date: holidayDate,

        Holiday_name: holidayName,

        Holiday_type: holiday.Holiday_type ?? purpose,

        Purpose: purpose || String(fallback?.Purpose ?? ""),

        Remarks: remarks,
    };
}

function rowToPayload(
    row: HrmsRow,
    includeDerivedFields = false,
): HolidayWritePayload {
    const holidayDate = String(
        row.Holiday_date ?? "",
    ).trim();

    const payload: HolidayWritePayload = {
        org_id: resolveOrgId(row.Org_Id),
        holiday_date: holidayDate,

        holiday_name: String(
            row.Holiday_name ?? "",
        ).trim(),

        holiday_type: String(
            row.Purpose ?? row.Holiday_type ?? "",
        ).trim(),

        remarks: String(row.Remarks ?? "").trim(),
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