"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import type { HrmsRow } from "@/types/hrms";

export type PayrollStatCard = {
  title: string;
  value: (rows: HrmsRow[]) => string;
  change: (rows: HrmsRow[]) => string;
  hint: string;
  description: string;
  tone: "primary" | "info" | "success" | "warning" | "danger" | "orange";
  icon: "users" | "userPlus" | "clock" | "calendar" | "briefcase" | "trendingDown";
  positive?: boolean;
};

type PayrollModulePageProps = {
  moduleId: string;
  stats?: PayrollStatCard[];
  modalSubtitle?: string;
  emptyStateMessage?: string;
  submitLabel?: string;
};

/** Prefer MasterDataPage + HRMS_MODULES. Kept as a thin alias. */
export function PayrollModulePage(props: PayrollModulePageProps) {
  return <MasterDataPage {...props} />;
}
