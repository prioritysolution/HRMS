"use client";

import { useMemo, useState } from "react";
import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { pad2 } from "@/lib/date-utils";
import { useI18n } from "@/i18n";

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

export default function LoginHistoryPage() {
  const { t } = useI18n();
  const defaults = useMemo(() => currentMonthRange(), []);
  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);

  const topContent = (
    <div className="card mb-4">
      <div className="card-body">
        <div className="flex flex-wrap items-end gap-3">
          <div className="max-w-xs">
            <label
              className="mb-1 block text-sm font-medium text-[var(--text-secondary)]"
              htmlFor="login-history-from"
            >
              {t("security.pages.loginHistory.from")}
            </label>
            <input
              id="login-history-from"
              type="date"
              className="form-control"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </div>
          <div className="max-w-xs">
            <label
              className="mb-1 block text-sm font-medium text-[var(--text-secondary)]"
              htmlFor="login-history-to"
            >
              {t("security.pages.loginHistory.to")}
            </label>
            <input
              id="login-history-to"
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
      moduleId="login-history"
      topContent={topContent}
      fetchParams={{
        from_date: toApiDateTime(fromDate),
        to_date: toApiDateTime(toDate, true),
      }}
      emptyStateMessage={t("security.pages.loginHistory.empty")}
    />
  );
}
