"use client";

import { useState } from "react";
import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { DatePicker } from "@/components/ui/DatePicker";
import { DAILY_STATS } from "@/lib/attendance-stats";
import { dateToIso, formatDateDisplay, parseDateToIso } from "@/lib/date-utils";

export default function DailyAttendancePage() {
  const [selectedDate, setSelectedDate] = useState(() => dateToIso(new Date()));

  const topContent = (
    <div className="card mb-4">
      <div className="card-body">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-xs">
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
              Attendance date
            </label>
            <DatePicker
              value={formatDateDisplay(selectedDate)}
              onChange={(value) => {
                const iso = parseDateToIso(value);
                if (iso) setSelectedDate(iso);
              }}
              clearable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <MasterDataPage
      moduleId="daily-attendance"
      stats={DAILY_STATS as any}
      topContent={topContent}
    />
  );
}
