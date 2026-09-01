"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { DASHBOARD_STATS } from "@/lib/attendance-stats";

export default function AttendanceDashboardPage() {
  return (
    <MasterDataPage
      moduleId="attendance-dashboard"
      stats={DASHBOARD_STATS}

    />
  );
}
