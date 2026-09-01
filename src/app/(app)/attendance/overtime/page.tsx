"use client";

import { AttendanceModulePage } from "@/components/attendance/AttendanceModulePage";

export default function OvertimePage() {
  return (
    <AttendanceModulePage
      moduleId="overtime"
      modalSubtitle="Record and review overtime hours beyond configured rules."
    />
  );
}
