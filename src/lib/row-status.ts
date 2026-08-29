const STATUS_KEYS = ["Status", "status", "Employment_status"] as const;

export function getRowStatusKey(row: object): (typeof STATUS_KEYS)[number] {
  const record = row as Record<string, unknown>;
  for (const key of STATUS_KEYS) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return key;
    }
  }
  return "Status";
}

export function getRowStatusValue(row: object): string {
  const record = row as Record<string, unknown>;
  const key = getRowStatusKey(row);
  const value = record[key];
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

export function formatRowStatus(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text || text === "1" || text === "ACTIVE" || text.toLowerCase() === "active") return "Active";
  if (text === "0" || text === "INACTIVE" || text.toLowerCase() === "inactive") return "Inactive";
  return text;
}

export function isRowInactive(row: object): boolean {
  return formatRowStatus(getRowStatusValue(row)) === "Inactive";
}
