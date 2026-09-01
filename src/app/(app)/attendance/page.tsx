"use client";

import { AttendanceModulePage } from "@/components/attendance/AttendanceModulePage";
import { DASHBOARD_STATS } from "@/lib/attendance-stats";

export default function AttendanceDashboardPage() {
  return (
    <AttendanceModulePage
      moduleId="attendance-dashboard"
      stats={DASHBOARD_STATS}
      emptyStateMessage="Add attendance records to monitor check-ins, working hours, and daily status."
    />
  );
}
