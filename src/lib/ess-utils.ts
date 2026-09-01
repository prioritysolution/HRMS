import type { AuthMeProfile, AuthUser } from "@/lib/api/types";
import type { HrmsRow } from "@/types/hrms";

export const DEFAULT_ESS_EMPLOYEE_CODE = "EMP-1001";

export function getEssEmployeeCode(
  user: AuthUser | null,
  profile?: AuthMeProfile | null,
): string {
  if (profile?.employeeCode) return profile.employeeCode;
  return DEFAULT_ESS_EMPLOYEE_CODE;
}

export function getEssEmployeeName(profile?: AuthMeProfile | null): string {
  return profile?.displayName ?? "Employee";
}

export function filterRowsByEmployee(
  rows: HrmsRow[],
  employeeCode: string,
): HrmsRow[] {
  if (!rows.some((r) => "Employee_code" in r)) return rows;
  return rows.filter((r) => r.Employee_code === employeeCode);
}

export const HR_APPROVAL_FIELDS = new Set([
  "Permanent_address",
  "Bank_account_no",
  "IFSC_code",
  "PAN_number",
  "Aadhaar_number",
  "Date_of_birth",
  "Emergency_contact",
]);

export function requiresHrApproval(fieldKey: string): boolean {
  return HR_APPROVAL_FIELDS.has(fieldKey);
}

export function isCriticalRequestType(requestType: string): boolean {
  return [
    "Address Change",
    "Bank Details Update",
    "Name Correction",
  ].some((t) => requestType.includes(t));
}
