"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import type { HrmsRow } from "@/types/hrms";

export type LeaveStatCard = {
  title: string;
  value: (rows: HrmsRow[]) => string;
  change: (rows: HrmsRow[]) => string;
  hint: string;
  description: string;
  tone: "primary" | "info" | "success" | "warning" | "danger" | "orange";
  icon: "users" | "userPlus" | "clock" | "calendar" | "briefcase" | "trendingDown";
  positive?: boolean;
};

type LeaveModulePageProps = {
  moduleId: string;
  stats?: LeaveStatCard[];
  modalSubtitle?: string;
  emptyStateMessage?: string;
};

/** Prefer MasterDataPage + HRMS_MODULES. Kept as a thin alias. */
export function LeaveModulePage(props: LeaveModulePageProps) {
  return <MasterDataPage {...props} />;
}
