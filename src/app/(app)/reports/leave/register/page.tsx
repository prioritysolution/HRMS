"use client";

import { useMemo, useState } from "react";
import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { pad2 } from "@/lib/date-utils";

function currentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return {
    from: `${year}-${pad2(month + 1)}-01`,
    to: `${year}-${pad2(month + 1)}-${pad2(lastDay)}`,
  };
}

export default function LeaveRegisterReportPage() {
  const defaults = useMemo(() => currentMonthRange(), []);
  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);

  return (
    <MasterDataPage
      moduleId="leave-register-report"
      fetchParams={{
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      }}
      extraActions={
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[9.5rem]">
            <label
              className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
              htmlFor="leave-register-from"
            >
              From
            </label>
            <input
              id="leave-register-from"
              type="date"
              className="form-control form-control-sm"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </div>
          <div className="min-w-[9.5rem]">
            <label
              className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
              htmlFor="leave-register-to"
            >
              To
            </label>
            <input
              id="leave-register-to"
              type="date"
              className="form-control form-control-sm"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </div>
        </div>
      }
      emptyStateMessage="Try adjusting the date range, leave type, or status filter."
    />
  );
}
