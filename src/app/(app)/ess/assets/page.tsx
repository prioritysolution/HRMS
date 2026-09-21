"use client";

import { EssModulePage } from "@/components/ess/EssModulePage";
import { useI18n } from "@/i18n";
import { employeeAssetService } from "@/lib/api/services/employee-asset.service";
import type { AuthMeProfile } from "@/lib/api/types";
import type { HrmsRow } from "@/types/hrms";

export default function EssAssetsPage() {
  const { t } = useI18n();

  async function loadMyAssets(profile: AuthMeProfile | null): Promise<HrmsRow[]> {
    const employeeId = profile?.employeeId;
    if (!employeeId) {
      throw new Error(t("ess.ui.assetsNotLinked"));
    }

    return employeeAssetService.listForEmployee({
      employee_id: employeeId,
      status: 1,
    });
  }

  return <EssModulePage moduleId="ess-assets" loadRows={loadMyAssets} />;
}
