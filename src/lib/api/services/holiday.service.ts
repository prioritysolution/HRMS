import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
    HolidayListQuery,
    HolidayRecord,
    HolidayWritePayload,
} from "@/lib/api/types";
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
    if (!query) {
        return API_ENDPOINTS.holiday.list;
    }

    const params = new URLSearchParams();

    if (query.holiday_id !== undefined) {
        params.set("holiday_id", String(query.holiday_id));
    }

    if (query.month_sl !== undefined) {
        params.set("month_sl", String(query.month_sl));
    }

    if (query.year_sl !== undefined) {
        params.set("year_sl", String(query.year_sl));
    }

    if (query.holiday_type) {
        params.set("holiday_type", query.holiday_type);
    }

    if (query.holiday_date) {
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

function holidayToRow(
    holiday: HolidayRecord,
): HrmsRow {
    return {
        id: String(holiday.Holiday_id),

        Holiday_id: holiday.Holiday_id,

        Month_sl: holiday.Month_sl,

        Year_Sl: holiday.Year_Sl,

        Holiday_date: normalizeDate(
            holiday.Holiday_date,
        ),

        Holiday_name: holiday.Holiday_name ?? "",

        Holiday_type: holiday.Holiday_type ?? "",
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
        holiday_date: holidayDate,

        holiday_name: String(
            row.Holiday_name ?? "",
        ).trim(),

        holiday_type: String(
            row.Holiday_type ?? "",
        ).trim(),
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

        return getList(payload).map(
            holidayToRow,
        );
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
            API_ENDPOINTS.holiday.delete(id),
            {
                unwrap: false,
            },
        );
    },
};