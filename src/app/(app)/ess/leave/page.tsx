"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, SoftStatus, type Column } from "@/components/ui/DataTable";
import { getEssModule } from "@/config/ess-modules";
import { getEssMockRows } from "@/data/ess-mock";
import { authService } from "@/lib/api/services/auth.service";
import { getEssEmployeeCode } from "@/lib/ess-utils";
import { formatDateDisplay } from "@/lib/date-utils";
import type { HrmsRow } from "@/types/hrms";

function buildCols(moduleId: "ess-leave-balance" | "ess-leave-history") {
  const config = getEssModule(moduleId);
  return config.columns.map((col) => ({
    key: col.key,
    header: col.header,
    render: (row: HrmsRow) => {
      if (col.type === "status") return <SoftStatus value={String(row[col.key] ?? "—")} />;
      if (col.type === "date") return formatDateDisplay(String(row[col.key] ?? "")) || "—";
      return String(row[col.key] ?? "—");
    },
  })) as Column<HrmsRow>[];
}

export default function EssLeavePage() {
  const [balanceRows, setBalanceRows] = useState<HrmsRow[]>([]);
  const [historyRows, setHistoryRows] = useState<HrmsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"balance" | "history">("balance");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await authService.getMeProfile();
      const code = getEssEmployeeCode(null, me);
      setBalanceRows(getEssMockRows("ess-leave-balance", code));
      setHistoryRows(getEssMockRows("ess-leave-history", code));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const balanceCols = useMemo(() => buildCols("ess-leave-balance"), []);
  const historyCols = useMemo(() => buildCols("ess-leave-history"), []);
  const totalBalance = balanceRows.reduce((s, r) => s + Number(r.Balance_days ?? 0), 0);
  const pendingCount = historyRows.filter((r) => r.Application_status === "Pending").length;

  return (
    <>
      <PageHeader
        title="My Leave"
        section="Employee Self Service"
        action={
          <Link href="/ess/leave/apply" className="btn btn-primary inline-flex items-center gap-2">
            <PlusCircle size={16} />
            Apply Leave
          </Link>
        }
      />
      <div className="container-fluid">
        <div className="ess-leave-summary mb-4">
          <div className="ess-leave-summary-item">
            <span>Total Balance</span>
            <strong>{totalBalance} days</strong>
          </div>
          <div className="ess-leave-summary-item">
            <span>Pending Applications</span>
            <strong>{pendingCount}</strong>
          </div>
          <div className="ess-leave-summary-item">
            <span>Leave Types</span>
            <strong>{balanceRows.length}</strong>
          </div>
        </div>

        <div className="ess-tabs mb-3">
          <button
            type="button"
            className={`ess-tab${tab === "balance" ? " ess-tab--active" : ""}`}
            onClick={() => setTab("balance")}
          >
            Leave Balance
          </button>
          <button
            type="button"
            className={`ess-tab${tab === "history" ? " ess-tab--active" : ""}`}
            onClick={() => setTab("history")}
          >
            Leave History
          </button>
        </div>

        {tab === "balance" ? (
          <DataTable
            columns={balanceCols}
            rows={balanceRows}
            title="Leave Balance"
            searchPlaceholder="Search leave types…"
            searchKeys={["Leave_type", "Leave_code"]}
            loading={loading}
            emptyStateMessage="No leave allocation found for this year."
          />
        ) : (
          <DataTable
            columns={historyCols}
            rows={historyRows}
            title="Leave History"
            searchPlaceholder="Search applications…"
            searchKeys={["Leave_type", "Application_status"]}
            loading={loading}
            emptyStateMessage="No leave applications on record."
          />
        )}
      </div>
    </>
  );
}
