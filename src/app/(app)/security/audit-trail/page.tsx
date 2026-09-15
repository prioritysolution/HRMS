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

function toApiDateTime(date: string, endOfDay = false): string | undefined {
  const trimmed = date.trim();
  if (!trimmed) return undefined;
  return endOfDay ? `${trimmed} 23:59:59` : `${trimmed} 00:00:00`;
}

export default function AuditTrailPage() {
  const defaults = useMemo(() => currentMonthRange(), []);
  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);

  const topContent = (
    <div className="card mb-4">
      <div className="card-body">
        <div className="flex flex-wrap items-end gap-3">
          <div className="max-w-xs">
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]" htmlFor="audit-trail-from">
              From
            </label>
            <input
              id="audit-trail-from"
              type="date"
              className="form-control"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </div>
          <div className="max-w-xs">
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]" htmlFor="audit-trail-to">
              To
            </label>
            <input
              id="audit-trail-to"
              type="date"
              className="form-control"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <MasterDataPage
      moduleId="audit-trail"
      topContent={topContent}
      fetchParams={{
        from_date: toApiDateTime(fromDate),
        to_date: toApiDateTime(toDate, true),
      }}
      emptyStateMessage="Try adjusting the date range or action filter."
    />
  );
}
