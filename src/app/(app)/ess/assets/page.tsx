"use client";

import { EssModulePage } from "@/components/ess/EssModulePage";
import { employeeAssetService } from "@/lib/api/services/employee-asset.service";
import type { AuthMeProfile } from "@/lib/api/types";
import type { HrmsRow } from "@/types/hrms";

async function loadMyAssets(profile: AuthMeProfile | null): Promise<HrmsRow[]> {
  const employeeId = profile?.employeeId;
  if (!employeeId) {
    throw new Error("Your employee profile is not linked. Asset assignments cannot be loaded.");
  }

  return employeeAssetService.listForEmployee({
    employee_id: employeeId,
    status: 1,
  });
}

export default function EssAssetsPage() {
  return (
    <EssModulePage
      moduleId="ess-assets"
      loadRows={loadMyAssets}
      emptyStateMessage="No assets are currently assigned to you."
    />
  );
}
