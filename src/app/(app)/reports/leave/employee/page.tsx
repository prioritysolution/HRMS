"use client";

import { useEffect, useState } from "react";
import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useI18n, translateHrmsLookup } from "@/i18n";
import { branchService, finYearService } from "@/lib/api";

export default function EmployeeLeaveReportPage() {
  const { language, t } = useI18n();
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
      filterExtra={
        <>
          <div className="table-filter-item">
            <label className="table-filter-label" htmlFor="employee-leave-fin-year">
              {translateHrmsLookup(language, "labels", "Financial Year")}
            </label>
            <SearchableSelect
              id="employee-leave-fin-year"
              value={finYearId}
              onChange={setFinYearId}
              options={finYearOptions}
              placeholder={t("reports.common.activeYear")}
              searchPlaceholder={t("reports.common.searchFinYear")}
              allowEmpty
              emptyLabel={t("reports.common.activeYear")}
              size="sm"
            />
          </div>
          <div className="table-filter-item">
            <label className="table-filter-label" htmlFor="employee-leave-branch">
              {translateHrmsLookup(language, "labels", "Branch")}
            </label>
            <SearchableSelect
              id="employee-leave-branch"
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
        </>
      }
      emptyStateMessage={t("reports.leaveEmployee.empty")}
    />
  );
}
