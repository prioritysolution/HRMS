"use client";

import { AttendanceModulePage } from "@/components/attendance/AttendanceModulePage";

export default function AttendanceRegularizationPage() {
  return (
    <AttendanceModulePage
      moduleId="regularization"
      modalSubtitle="Request attendance corrections for missing or incorrect punches."
    />
  );
}
