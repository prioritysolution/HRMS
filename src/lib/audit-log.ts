import { getHrmsModule } from "@/config/hrms-modules";
import { applOptionService } from "@/lib/api/services/appl-options.service";
import { auditLogService } from "@/lib/api/services/audit-log.service";
import type { AuditLogCreatePayload, AuditLogJsonValue } from "@/lib/api/types";

/** appl-options group for audit actions (Insert / Update / Delete). */
export const AUDIT_ACTION_OPT_GRP_ID = 15;

export type AuditActionKind = "create" | "update" | "delete";

/** Fallback Opt_Codes when appl-options are unavailable (matches common seeds; Update = 2 per API docs). */
const AUDIT_ACTION_FALLBACKS: Record<AuditActionKind, number> = {
  create: 1,
  update: 2,
  delete: 3,
};

type AuditActionCodes = Record<AuditActionKind, number>;

let actionCodesPromise: Promise<AuditActionCodes> | null = null;

function matchActionKind(description: string): AuditActionKind | null {
  const text = description.trim().toLowerCase();
  if (/\b(insert|create|add)\b/.test(text) || text === "i") return "create";
  if (/\b(update|edit|modify)\b/.test(text) || text === "u") return "update";
  if (/\b(delete|remove|deactivate)\b/.test(text) || text === "d") return "delete";
  return null;
}

async function resolveActionCodes(): Promise<AuditActionCodes> {
  try {
    const options = await applOptionService.list({
      opt_grp_id: AUDIT_ACTION_OPT_GRP_ID,
      is_active: 1,
    });
    const codes: AuditActionCodes = { ...AUDIT_ACTION_FALLBACKS };
    for (const option of options) {
      const kind = matchActionKind(String(option.Opt_Description ?? ""));
      if (!kind) continue;
      const code = Number(option.Opt_Code);
      if (Number.isFinite(code)) codes[kind] = code;
    }
    return codes;
  } catch {
    return { ...AUDIT_ACTION_FALLBACKS };
  }
}

function getActionCodes(): Promise<AuditActionCodes> {
  if (!actionCodesPromise) {
    actionCodesPromise = resolveActionCodes().catch(() => {
      actionCodesPromise = null;
      return { ...AUDIT_ACTION_FALLBACKS };
    });
  }
  return actionCodesPromise;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Strip File / non-JSON values so the audit payload stays serializable. */
export function toAuditJson(value: unknown): AuditLogJsonValue | null {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (typeof File !== "undefined" && value instanceof File) {
    return { name: value.name, size: value.size, type: value.type };
  }
  if (Array.isArray(value)) {
    return value.map((item) => toAuditJson(item) ?? null);
  }
  if (isPlainObject(value)) {
    const out: Record<string, AuditLogJsonValue> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry === undefined) continue;
      const normalized = toAuditJson(entry);
      if (normalized !== null) out[key] = normalized;
    }
    return out;
  }
  return String(value);
}

export function resolveAuditRecordId(
  row: Record<string, unknown> | null | undefined,
  preferredKeys: string[] = [],
): number | undefined {
  if (!row) return undefined;
  const keys = [
    ...preferredKeys,
    "id",
    "Employee_id",
    "employee_id",
    "record_id",
    "Record_Id",
  ];
  for (const key of keys) {
    const raw = row[key];
    if (raw === undefined || raw === null || raw === "") continue;
    const numeric = Number(raw);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }
  return undefined;
}

export type LogAuditInput = {
  moduleId: string;
  action: AuditActionKind;
  recordId?: number | string | null;
  oldValues?: unknown;
  newValues?: unknown;
  /** Override module section (parent menu). Defaults to HrmsModuleConfig.section */
  menuName?: string;
  /** Override module tableName */
  tableName?: string;
};

/**
 * Persist an audit log entry. Failures are swallowed so CRUD UX is never blocked.
 */
export async function logAudit(input: LogAuditInput): Promise<void> {
  try {
    const config = getHrmsModule(input.moduleId);
    const codes = await getActionCodes();
    const recordId =
      input.recordId === undefined || input.recordId === null || input.recordId === ""
        ? undefined
        : Number(input.recordId);

    const payload: AuditLogCreatePayload = {
      action: codes[input.action],
      menu_name: input.menuName ?? config.section,
      table_name: input.tableName ?? config.tableName,
    };

    if (recordId !== undefined && Number.isFinite(recordId) && recordId > 0) {
      payload.record_id = recordId;
    }

    if (input.oldValues !== undefined) {
      payload.old_values = toAuditJson(input.oldValues);
    }
    if (input.newValues !== undefined) {
      payload.new_values = toAuditJson(input.newValues);
    }

    await auditLogService.create(payload);
  } catch (error) {
    if (typeof console !== "undefined") {
      console.warn("[audit-log] failed to record change", error);
    }
  }
}

/** Fire-and-forget wrapper for UI handlers. */
export function queueAuditLog(input: LogAuditInput): void {
  void logAudit(input);
}
