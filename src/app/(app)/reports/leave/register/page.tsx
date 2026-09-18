"use client";

import { useMemo, useState } from "react";
import { DatePicker } from "@/components/ui/DatePicker";
import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { useI18n, translateHrmsLookup } from "@/i18n";
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
  const { language, t } = useI18n();
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
      filterExtra={
        <>
          <div className="table-filter-item">
            <label className="table-filter-label" htmlFor="leave-register-from">
              {translateHrmsLookup(language, "labels", "From")}
            </label>
            <DatePicker
              id="leave-register-from"
              value={fromDate}
              onChange={setFromDate}
              max={toDate || undefined}
            />
          </div>
          <div className="table-filter-item">
            <label className="table-filter-label" htmlFor="leave-register-to">
              {translateHrmsLookup(language, "labels", "To")}
            </label>
            <DatePicker
              id="leave-register-to"
              value={toDate}
              onChange={setToDate}
              min={fromDate || undefined}
            />
          </div>
        </>
      }
      emptyStateMessage={t("reports.leaveRegister.empty")}
    />
  );
}
