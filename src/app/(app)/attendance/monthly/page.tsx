"use client";

import { useState } from "react";
import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { MONTHLY_STATS } from "@/lib/attendance-stats";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const YEAR_OPTIONS = Array.from({ length: 11 }, (_, i) => String(new Date().getFullYear() - 5 + i));

export default function MonthlyAttendancePage() {
  const [selectedMonth, setSelectedMonth] = useState(() => String(new Date().getMonth()));
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));

  const topContent = (
    <div className="card mb-4">
      <div className="card-body">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-end gap-3 max-w-sm">
            <div className="w-40">
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                Month
              </label>
              <SearchableSelect
                value={selectedMonth}
                onChange={(val) => setSelectedMonth(String(val))}
                options={MONTH_NAMES.map((m, i) => ({ label: m, value: String(i) }))}
                clearable={false}
              />
            </div>
            <div className="w-32">
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                Year
              </label>
              <SearchableSelect
                value={selectedYear}
                onChange={(val) => setSelectedYear(String(val))}
                options={YEAR_OPTIONS.map((y) => ({ label: y, value: y }))}
                clearable={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <MasterDataPage
      moduleId="monthly-attendance"
      stats={MONTHLY_STATS as any}
      topContent={topContent}
    />
  );
}
