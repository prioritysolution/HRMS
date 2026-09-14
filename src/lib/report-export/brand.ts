import { organizationService } from "@/lib/api/services/organization.service";
import type { ReportBrand } from "@/lib/report-export/types";
import {
  DEFAULT_REPORT_BRAND,
  DEFAULT_REPORT_LOGO,
} from "@/lib/report-export/utils";

export { DEFAULT_REPORT_BRAND, DEFAULT_REPORT_LOGO };

/** Resolve organization brand once for any report export. */
export async function resolveReportBrand(): Promise<ReportBrand> {
  try {
    const organizations = await organizationService.list({ status: 1 });
    const org = organizations[0];
    if (!org) return { ...DEFAULT_REPORT_BRAND };

    const companyName =
      String(org.Org_Name ?? org.Legal_Name ?? "").trim() ||
      DEFAULT_REPORT_BRAND.companyName;
    const logoUrl =
      String(org.Logo_Url ?? "").trim() || DEFAULT_REPORT_LOGO;

    return { companyName, logoUrl };
  } catch {
    return { ...DEFAULT_REPORT_BRAND };
  }
}
