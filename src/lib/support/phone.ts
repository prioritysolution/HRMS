import { getStoredMeData } from "@/lib/auth/session";

const PHONE_KEYS = [
  "userPhone",
  "user_phone",
  "User_Phone",
  "mobile",
  "Mobile",
  "phone",
  "Phone",
  "mobile_no",
  "Mobile_No",
  "contact",
  "Contact",
];

const MOB_KEYS = ["userMob", "user_mob", "User_Mob"];

function profileField(data: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function phoneFromRecord(data: Record<string, unknown>): string {
  return profileField(data, PHONE_KEYS) || profileField(data, MOB_KEYS);
}

export function readSignedInSupportPhone(): string {
  const data = getStoredMeData();
  if (!data) return "";
  const direct = phoneFromRecord(data);
  if (direct) return direct;
  for (const value of Object.values(data)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const nested = phoneFromRecord(value as Record<string, unknown>);
    if (nested) return nested;
  }
  return "";
}
