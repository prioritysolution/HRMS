"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { PROCESSING_STATS } from "@/lib/attendance-stats";

export default function AttendanceProcessingPage() {
  return (
    <MasterDataPage
      moduleId="attendance-processing"
      stats={PROCESSING_STATS as any}
    />
  );
}
