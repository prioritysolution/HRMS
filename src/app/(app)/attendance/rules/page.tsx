"use client";

import { AttendanceModulePage } from "@/components/attendance/AttendanceModulePage";
import { enrichRuleRow } from "@/lib/attendance-stats";

export default function AttendanceRulesPage() {
  return (
    <AttendanceModulePage
      moduleId="attendance-rules"
      enrichRow={(values) => enrichRuleRow(values)}
      modalSubtitle="Configure shift timing, grace period, thresholds, overtime, half-day, and regularization rules."
      emptyStateMessage="Add attendance rules to define grace period, late threshold, working hours, and overtime policies."
    />
  );
}
