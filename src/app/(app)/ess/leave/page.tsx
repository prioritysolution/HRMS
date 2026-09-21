"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, SoftStatus, type Column } from "@/components/ui/DataTable";
import { getEssModule } from "@/config/ess-modules";
import { getEssMockRows } from "@/data/ess-mock";
import { useI18n, translateEssLookup } from "@/i18n";
import { authService } from "@/lib/api/services/auth.service";
import { getEssEmployeeCode } from "@/lib/ess-utils";
import { formatDateDisplay } from "@/lib/date-utils";
import type { HrmsRow } from "@/types/hrms";

export default function EssLeavePage() {
  const { language, t } = useI18n();
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

  const balanceCols = useMemo(() => {
    const config = getEssModule("ess-leave-balance");
    return config.columns.map((col) => ({
      key: col.key,
      header: translateEssLookup(language, "headers", col.header),
      render: (row: HrmsRow) => {
        if (col.type === "status") return <SoftStatus value={String(row[col.key] ?? "—")} />;
        if (col.type === "date") return formatDateDisplay(String(row[col.key] ?? "")) || "—";
        return String(row[col.key] ?? "—");
      },
    })) as Column<HrmsRow>[];
  }, [language]);

  const historyCols = useMemo(() => {
    const config = getEssModule("ess-leave-history");
    return config.columns.map((col) => ({
      key: col.key,
      header: translateEssLookup(language, "headers", col.header),
      render: (row: HrmsRow) => {
        if (col.type === "status") return <SoftStatus value={String(row[col.key] ?? "—")} />;
        if (col.type === "date") return formatDateDisplay(String(row[col.key] ?? "")) || "—";
        return String(row[col.key] ?? "—");
      },
    })) as Column<HrmsRow>[];
  }, [language]);

  const totalBalance = balanceRows.reduce((s, r) => s + Number(r.Balance_days ?? 0), 0);
  const pendingCount = historyRows.filter((r) => r.Application_status === "Pending").length;

  return (
    <>
      <PageHeader
        title={t("ess.leavePage.title")}
        section={t("ess.section")}
        action={
          <Link href="/ess/leave/apply" className="btn btn-primary inline-flex items-center gap-2">
            <PlusCircle size={16} />
            {t("ess.applyLeave")}
          </Link>
        }
      />
      <div className="container-fluid">
        <div className="ess-leave-summary mb-4">
          <div className="ess-leave-summary-item">
            <span>{t("ess.leavePage.totalBalance")}</span>
            <strong>
              {totalBalance} {t("ess.days").toLowerCase()}
            </strong>
          </div>
          <div className="ess-leave-summary-item">
            <span>{t("ess.leavePage.pendingApplications")}</span>
            <strong>{pendingCount}</strong>
          </div>
          <div className="ess-leave-summary-item">
            <span>{t("ess.leavePage.leaveTypes")}</span>
            <strong>{balanceRows.length}</strong>
          </div>
        </div>

        <div className="ess-tabs mb-3">
          <button
            type="button"
            className={`ess-tab${tab === "balance" ? " ess-tab--active" : ""}`}
            onClick={() => setTab("balance")}
          >
            {t("ess.leavePage.balanceTab")}
          </button>
          <button
            type="button"
            className={`ess-tab${tab === "history" ? " ess-tab--active" : ""}`}
            onClick={() => setTab("history")}
          >
            {t("ess.leavePage.historyTab")}
          </button>
        </div>

        {tab === "balance" ? (
          <DataTable
            columns={balanceCols}
            rows={balanceRows}
            title={t("ess.leavePage.balanceTitle")}
            searchPlaceholder={t("ess.leavePage.searchTypes")}
            searchKeys={["Leave_type", "Leave_code"]}
            loading={loading}
            emptyStateMessage={t("ess.leavePage.emptyBalance")}
          />
        ) : (
          <DataTable
            columns={historyCols}
            rows={historyRows}
            title={t("ess.leavePage.historyTitle")}
            searchPlaceholder={t("ess.leavePage.searchApplications")}
            searchKeys={["Leave_type", "Application_status"]}
            loading={loading}
            emptyStateMessage={t("ess.leavePage.emptyHistory")}
          />
        )}
      </div>
    </>
  );
}
