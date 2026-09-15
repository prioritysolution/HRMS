import { getCurrentOrgId } from "@/lib/auth/org-context";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { extractPaginatedList } from "@/lib/api/paginated-list";
import type { LoginHistoryListQuery, LoginHistoryRecord } from "@/lib/api/types";
import { formatDateDisplay, formatTimeDisplay } from "@/lib/date-utils";
import type { HrmsRow } from "@/types/hrms";

const DEFAULT_PER_PAGE = 100;

function readValue(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function optionalText(value: unknown): string {
  if (value === undefined || value === null || value === false) return "";
  return String(value).trim();
}

function optionalId(value: unknown): number | "" {
  if (value === undefined || value === null || value === "") return "";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : "";
}

function toLoginStatusFlag(value: unknown): 0 | 1 {
  if (value === 0 || value === "0" || value === false) return 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "failed" || normalized === "fail" || normalized === "0") return 0;
  }
  return 1;
}

function formatDateTimeDisplay(value: unknown): string {
  const raw = optionalText(value);
  if (!raw) return "";

  const normalized = raw.includes("T") ? raw.replace("T", " ") : raw;
  const [datePart, timePart = ""] = normalized.split(" ");
  const date = formatDateDisplay(datePart.slice(0, 10));
  const time = formatTimeDisplay(timePart.replace(/Z$/i, "").slice(0, 8));

  if (date && time) return `${date} ${time}`;
  return date || time || raw;
}

export function loginHistoryToRow(record: LoginHistoryRecord): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const histId = readValue(source, ["Login_hist_id", "login_hist_id", "id"]);
  const loginStatus = toLoginStatusFlag(readValue(source, ["Login_status", "login_status"]));
  const loginAtRaw = optionalText(readValue(source, ["Login_at", "login_at"]));
  const logoutAtRaw = optionalText(readValue(source, ["Logout_at", "logout_at"]));

  return {
    id: String(histId ?? ""),
    Login_hist_id: Number(histId ?? 0),
    User_Id: optionalId(readValue(source, ["User_Id", "user_id"])),
    User_Name: optionalText(readValue(source, ["User_Name", "user_name"])),
    Org_Id: optionalId(readValue(source, ["Org_Id", "org_id"])),
    Org_Cd: optionalText(readValue(source, ["Org_Cd", "org_cd"])),
    Org_Name: optionalText(readValue(source, ["Org_Name", "org_name"])),
    Branch_Id: optionalId(readValue(source, ["Branch_Id", "branch_id"])),
    Branch_Code: optionalText(readValue(source, ["Branch_Code", "branch_code"])),
    Branch_Name: optionalText(readValue(source, ["Branch_Name", "branch_name"])),
    Login_status: loginStatus,
    Login_Status: loginStatus === 1 ? "Success" : "Failed",
    Login_at: formatDateTimeDisplay(loginAtRaw),
    Login_at_raw: loginAtRaw,
    Logout_at: formatDateTimeDisplay(logoutAtRaw),
    Logout_at_raw: logoutAtRaw,
    Ip_address: optionalText(readValue(source, ["Ip_address", "ip_address"])),
    User_agent: optionalText(readValue(source, ["User_agent", "user_agent"])),
    Remarks: optionalText(readValue(source, ["Remarks", "remarks"])),
  };
}

function withListQuery(basePath: string, query?: LoginHistoryListQuery) {
  const params = new URLSearchParams();
  if (query?.login_hist_id !== undefined) {
    params.set("login_hist_id", String(query.login_hist_id));
  }
  if (query?.user_id !== undefined) params.set("user_id", String(query.user_id));

  const userName = query?.user_name ?? query?.search;
  if (userName) params.set("user_name", userName);

  const orgId = query?.org_id ?? getCurrentOrgId();
  if (orgId !== undefined) params.set("org_id", String(orgId));

  if (query?.branch_id !== undefined) params.set("branch_id", String(query.branch_id));

  const loginStatus = query?.login_status ?? query?.status;
  if (loginStatus !== undefined) params.set("login_status", String(loginStatus));

  if (query?.from_date) params.set("from_date", query.from_date);
  if (query?.to_date) params.set("to_date", query.to_date);
  if (query?.page !== undefined) params.set("page", String(query.page));
  if (query?.per_page !== undefined) params.set("per_page", String(query.per_page));

  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

async function fetchPage(query?: LoginHistoryListQuery) {
  const payload = await apiClient.get<unknown>(
    withListQuery(API_ENDPOINTS.loginHistory.list, query),
  );
  return extractPaginatedList<LoginHistoryRecord>(payload);
}

export const loginHistoryService = {
  listPage: async (query?: LoginHistoryListQuery) => {
    const page = query?.page ?? 1;
    const perPage = query?.per_page ?? DEFAULT_PER_PAGE;
    const { items, meta } = await fetchPage({
      ...query,
      page,
      per_page: perPage,
    });
    return {
      rows: items.map(loginHistoryToRow),
      total: Number(meta?.total ?? items.length),
    };
  },

  list: async (query?: LoginHistoryListQuery) => {
    const result = await loginHistoryService.listPage({
      ...query,
      page: query?.page ?? 1,
      per_page: query?.per_page ?? DEFAULT_PER_PAGE,
    });
    return result.rows;
  },
};
