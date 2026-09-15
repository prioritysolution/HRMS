import { isSoftApiError } from "@/lib/api/client";

/**
 * Lookup/list helpers must not crash the UI when the user's role
 * lacks the related menu permission (HTTP 403 from the API).
 */
export function isSoftListFailure(payload: unknown): boolean {
  return isSoftApiError(payload);
}
