"use client";

import { useEffect, useState } from "react";
import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useI18n, translateHrmsLookup } from "@/i18n";
import { branchService } from "@/lib/api";

export default function LeavePendingReportPage() {
  const { language, t } = useI18n();
  const [branchId, setBranchId] = useState("");
  const [minPendingDays, setMinPendingDays] = useState("");
  const [branchOptions, setBranchOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  useEffect(() => {
    let cancelled = false;

    async function loadBranches() {
      try {
        const branches = await branchService.list({ status: 1 });
        if (cancelled) return;
        setBranchOptions(
          branches
            .map((row) => ({
              value: String(row.Branch_Id ?? row.id ?? ""),
              label: String(row.Branch_Name ?? row.Branch_Cd ?? ""),
            }))
            .filter((option) => option.value && option.label),
        );
      } catch {
        if (!cancelled) setBranchOptions([]);
      }
    }

    void loadBranches();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MasterDataPage
      moduleId="leave-pending-report"
      fetchParams={{
        branch_id: branchId || undefined,
        min_pending_days: minPendingDays || undefined,
      }}
      filterExtra={
        <>
          <div className="table-filter-item">
            <label className="table-filter-label" htmlFor="leave-pending-branch">
              {translateHrmsLookup(language, "labels", "Branch")}
            </label>
            <SearchableSelect
              id="leave-pending-branch"
              value={branchId}
              onChange={setBranchId}
              options={branchOptions}
              placeholder={t("reports.common.allBranches")}
              searchPlaceholder={t("reports.common.searchBranch")}
              allowEmpty
              emptyLabel={t("reports.common.allBranches")}
              size="sm"
            />
          </div>
          <div className="table-filter-item">
            <label className="table-filter-label" htmlFor="leave-pending-min-days">
              {t("reports.leavePending.minPendingDays")}
            </label>
            <input
              id="leave-pending-min-days"
              type="number"
              min={0}
              step={1}
              className="form-control"
              placeholder={t("reports.common.exampleDays", { n: 2 })}
              value={minPendingDays}
              onChange={(event) => setMinPendingDays(event.target.value)}
            />
          </div>
        </>
      }
      emptyStateMessage={t("reports.leavePending.empty")}
    />
  );
}
