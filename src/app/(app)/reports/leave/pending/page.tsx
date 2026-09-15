"use client";

import { useEffect, useState } from "react";
import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { branchService } from "@/lib/api";

export default function LeavePendingReportPage() {
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
              Branch
            </label>
            <SearchableSelect
              id="leave-pending-branch"
              value={branchId}
              onChange={setBranchId}
              options={branchOptions}
              placeholder="All Branches"
              searchPlaceholder="Search branch..."
              allowEmpty
              emptyLabel="All Branches"
              size="sm"
            />
          </div>
          <div className="table-filter-item">
            <label className="table-filter-label" htmlFor="leave-pending-min-days">
              Min Pending Days
            </label>
            <input
              id="leave-pending-min-days"
              type="number"
              min={0}
              step={1}
              className="form-control"
              placeholder="e.g. 2"
              value={minPendingDays}
              onChange={(event) => setMinPendingDays(event.target.value)}
            />
          </div>
        </>
      }
      emptyStateMessage="Try adjusting the branch, min pending days, or leave type filter."
    />
  );
}
