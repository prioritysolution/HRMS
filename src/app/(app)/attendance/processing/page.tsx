"use client";

import { AttendanceModulePage } from "@/components/attendance/AttendanceModulePage";
import { PROCESSING_STATS, enrichProcessingRow } from "@/lib/attendance-stats";

export default function AttendanceProcessingPage() {
  return (
    <AttendanceModulePage
      moduleId="attendance-processing"
      stats={PROCESSING_STATS}
      enrichRow={(values) => enrichProcessingRow(values)}
      modalSubtitle="Run attendance sync, monthly close, overtime, or regularization batches."
      emptyStateMessage="Run a processing batch to sync punches, calculate overtime, or close monthly attendance."
    />
  );
}
