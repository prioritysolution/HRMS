"use client";

import { AttendanceModulePage } from "@/components/attendance/AttendanceModulePage";
import { SOURCES_STATS, enrichSourceRow } from "@/lib/attendance-stats";

export default function AttendanceSourcesPage() {
  return (
    <AttendanceModulePage
      moduleId="attendance-sources"
      stats={SOURCES_STATS}
      enrichRow={(values) => enrichSourceRow(values)}
      modalSubtitle="Configure biometric, mobile, web, manual, and API attendance sources."
      emptyStateMessage="Configure attendance sources to capture punches from devices, apps, and integrations."
    />
  );
}
