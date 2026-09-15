"use client";

import { useEffect, useState } from "react";
import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { branchService, finYearService } from "@/lib/api";

export default function EmployeeLeaveReportPage() {
  const [finYearId, setFinYearId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [finYearOptions, setFinYearOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [branchOptions, setBranchOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  useEffect(() => {
    let cancelled = false;

    async function loadLookups() {
      try {
        const [years, branches] = await Promise.all([
          finYearService.list({ status: 1 }),
          branchService.list({ status: 1 }),
        ]);
        if (cancelled) return;

        const yearOptions = years
          .map((row) => {
            const value = String(row.Year_Id ?? row.id ?? "").trim();
            const label = String(row.Year_Name ?? row.Financial_year ?? "").trim();
            if (!value || !label) return null;
            return {
              value,
              label,
              isCurrent: Boolean(row.Is_Current) || Number(row.Status) === 1,
            };
          })
          .filter(
            (option): option is { value: string; label: string; isCurrent: boolean } =>
              option !== null,
          )
          .sort((left, right) =>
            right.label.localeCompare(left.label, undefined, { numeric: true }),
          );

        setFinYearOptions(
          yearOptions.map(({ value, label }) => ({ value, label })),
        );

        const current =
          yearOptions.find((option) => option.isCurrent) ?? yearOptions[0];
        setFinYearId((prev) => prev || current?.value || "");

        setBranchOptions(
          branches
            .map((row) => ({
              value: String(row.Branch_Id ?? row.id ?? ""),
              label: String(row.Branch_Name ?? row.Branch_Cd ?? ""),
            }))
            .filter((option) => option.value && option.label),
        );
      } catch {
        if (!cancelled) {
          setFinYearOptions([]);
          setBranchOptions([]);
        }
      }
    }

    void loadLookups();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MasterDataPage
      moduleId="employee-leave-report"
      fetchParams={{
        fin_year: finYearId || undefined,
        branch_id: branchId || undefined,
      }}
      extraActions={
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[10.5rem]">
            <label
              className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
              htmlFor="employee-leave-fin-year"
            >
              Financial Year
            </label>
            <select
              id="employee-leave-fin-year"
              className="form-select form-select-sm"
              value={finYearId}
              onChange={(event) => setFinYearId(event.target.value)}
            >
              <option value="">Active Year</option>
              {finYearOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[10.5rem]">
            <label
              className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
              htmlFor="employee-leave-branch"
            >
              Branch
            </label>
            <select
              id="employee-leave-branch"
              className="form-select form-select-sm"
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
            >
              <option value="">All Branches</option>
              {branchOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      }
      emptyStateMessage="Try adjusting the financial year, branch, or leave type filter."
    />
  );
}
