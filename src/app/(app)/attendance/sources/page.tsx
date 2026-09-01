"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { SOURCES_STATS, enrichSourceRow } from "@/lib/attendance-stats";

export default function AttendanceSourcesPage() {
  return (
    <MasterDataPage
      moduleId="attendance-sources"
      stats={SOURCES_STATS}


    />
  );
}
