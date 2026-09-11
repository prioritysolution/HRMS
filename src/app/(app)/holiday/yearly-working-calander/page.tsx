"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { TableSectionHeader } from "@/components/ui/TableSectionHeader";
import { finYearService } from "@/lib/api/services/fin-year.service";
import { latestFinancialYear } from "@/lib/leave-module-utils";

type WorkingMonthRow = {
  month: string;
  totalDays: number;
  workingDays: number;
  saturday: number;
  sunday: number;
  holiday: number;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DEMO_MONTHS: Record<string, Omit<WorkingMonthRow, "month">[]> = {
  "2026": [
    { totalDays: 31, workingDays: 23, saturday: 2, sunday: 4, holiday: 2 },
    { totalDays: 28, workingDays: 20, saturday: 4, sunday: 4, holiday: 0 },
    { totalDays: 31, workingDays: 22, saturday: 4, sunday: 4, holiday: 1 },
    { totalDays: 30, workingDays: 22, saturday: 4, sunday: 4, holiday: 0 },
    { totalDays: 31, workingDays: 21, saturday: 4, sunday: 5, holiday: 1 },
    { totalDays: 30, workingDays: 22, saturday: 4, sunday: 4, holiday: 0 },
    { totalDays: 31, workingDays: 23, saturday: 4, sunday: 4, holiday: 0 },
    { totalDays: 31, workingDays: 21, saturday: 5, sunday: 5, holiday: 0 },
    { totalDays: 30, workingDays: 22, saturday: 4, sunday: 4, holiday: 0 },
    { totalDays: 31, workingDays: 21, saturday: 4, sunday: 4, holiday: 2 },
    { totalDays: 30, workingDays: 21, saturday: 4, sunday: 5, holiday: 0 },
    { totalDays: 31, workingDays: 23, saturday: 4, sunday: 4, holiday: 0 },
  ],
  "2025": [
    { totalDays: 31, workingDays: 22, saturday: 4, sunday: 4, holiday: 1 },
    { totalDays: 28, workingDays: 20, saturday: 4, sunday: 4, holiday: 0 },
    { totalDays: 31, workingDays: 21, saturday: 5, sunday: 5, holiday: 0 },
    { totalDays: 30, workingDays: 22, saturday: 4, sunday: 4, holiday: 0 },
    { totalDays: 31, workingDays: 22, saturday: 4, sunday: 4, holiday: 1 },
    { totalDays: 30, workingDays: 21, saturday: 4, sunday: 5, holiday: 0 },
    { totalDays: 31, workingDays: 23, saturday: 4, sunday: 4, holiday: 0 },
    { totalDays: 31, workingDays: 21, saturday: 5, sunday: 5, holiday: 0 },
    { totalDays: 30, workingDays: 22, saturday: 4, sunday: 4, holiday: 0 },
    { totalDays: 31, workingDays: 22, saturday: 4, sunday: 4, holiday: 1 },
    { totalDays: 30, workingDays: 20, saturday: 5, sunday: 5, holiday: 0 },
    { totalDays: 31, workingDays: 23, saturday: 4, sunday: 4, holiday: 0 },
  ],
  "2024": [
    { totalDays: 31, workingDays: 22, saturday: 4, sunday: 4, holiday: 1 },
    { totalDays: 29, workingDays: 21, saturday: 4, sunday: 4, holiday: 0 },
    { totalDays: 31, workingDays: 21, saturday: 5, sunday: 5, holiday: 0 },
    { totalDays: 30, workingDays: 22, saturday: 4, sunday: 4, holiday: 0 },
    { totalDays: 31, workingDays: 23, saturday: 4, sunday: 4, holiday: 0 },
    { totalDays: 30, workingDays: 20, saturday: 5, sunday: 5, holiday: 0 },
    { totalDays: 31, workingDays: 23, saturday: 4, sunday: 4, holiday: 0 },
    { totalDays: 31, workingDays: 22, saturday: 4, sunday: 4, holiday: 1 },
    { totalDays: 30, workingDays: 21, saturday: 4, sunday: 5, holiday: 0 },
    { totalDays: 31, workingDays: 22, saturday: 4, sunday: 4, holiday: 1 },
    { totalDays: 30, workingDays: 21, saturday: 5, sunday: 4, holiday: 0 },
    { totalDays: 31, workingDays: 22, saturday: 4, sunday: 5, holiday: 0 },
  ],
  "2027": [
    { totalDays: 31, workingDays: 21, saturday: 5, sunday: 5, holiday: 0 },
    { totalDays: 28, workingDays: 20, saturday: 4, sunday: 4, holiday: 0 },
    { totalDays: 31, workingDays: 23, saturday: 4, sunday: 4, holiday: 0 },
    { totalDays: 30, workingDays: 22, saturday: 4, sunday: 4, holiday: 0 },
    { totalDays: 31, workingDays: 21, saturday: 5, sunday: 5, holiday: 0 },
    { totalDays: 30, workingDays: 22, saturday: 4, sunday: 4, holiday: 0 },
    { totalDays: 31, workingDays: 22, saturday: 5, sunday: 4, holiday: 0 },
    { totalDays: 31, workingDays: 22, saturday: 4, sunday: 5, holiday: 0 },
    { totalDays: 30, workingDays: 22, saturday: 4, sunday: 4, holiday: 0 },
    { totalDays: 31, workingDays: 21, saturday: 4, sunday: 5, holiday: 1 },
    { totalDays: 30, workingDays: 22, saturday: 4, sunday: 4, holiday: 0 },
    { totalDays: 31, workingDays: 23, saturday: 4, sunday: 4, holiday: 0 },
  ],
};

function yearFromFinancialYear(financialYear: string) {
  return financialYear.slice(0, 4);
}

function buildRows(financialYear: string): WorkingMonthRow[] {
  const year = yearFromFinancialYear(financialYear);
  const months = DEMO_MONTHS[year] ?? DEMO_MONTHS["2026"];
  return MONTHS.map((month, index) => ({
    month: `${month} - ${year}`,
    ...months[index],
  }));
}

export default function YearlyWorkingCalendarPage() {
  const [financialYear, setFinancialYear] = useState("");
  const [yearOptions, setYearOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadFinancialYears() {
      try {
        const options = await finYearService.options(1);
        if (cancelled) return;
        setYearOptions(options);
        setFinancialYear((current) => {
          if (current && options.some((option) => option.value === current)) return current;
          return latestFinancialYear(options.map((option) => option.value));
        });
      } catch {
        if (!cancelled) {
          setYearOptions([]);
          setFinancialYear("");
        }
      }
    }

    void loadFinancialYears();

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(
    () => (financialYear ? buildRows(financialYear) : []),
    [financialYear],
  );

  return (
    <>
      <PageHeader title="Yearly Working Calendar" section="Organization Setup" hideTitle />
      <div className="container-fluid">
        <div className="card">
          <div className="card-body">
            <TableSectionHeader title="Yearly Working Calendar" />

            <div className="table-filters-bar">
              <div className="table-filters-head">
                <span className="table-filters-title">Details</span>
              </div>
              <div className="table-filters">
                <div className="table-filter-item" style={{ maxWidth: 280 }}>
                  <label className="table-filter-label" htmlFor="financial-year">
                    Financial Year
                  </label>
                  <SearchableSelect
                    id="financial-year"
                    name="financialYear"
                    value={financialYear}
                    onChange={setFinancialYear}
                    options={yearOptions}
                    placeholder="Select Financial Year"
                    searchPlaceholder="Search financial year..."
                    size="sm"
                  />
                </div>
              </div>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="si-col">SI NO</th>
                    <th>Month & Year</th>
                    <th>Total Days</th>
                    <th>Working Days</th>
                    <th>Saturday</th>
                    <th>Sunday</th>
                    <th>Holiday (NI)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-4">
                        {yearOptions.length === 0
                          ? "No financial years available."
                          : "Select a financial year to view the calendar."}
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, index) => (
                      <tr key={row.month}>
                        <td className="si-col">{index + 1}</td>
                        <td>{row.month}</td>
                        <td>{row.totalDays}</td>
                        <td>{row.workingDays}</td>
                        <td>{row.saturday}</td>
                        <td>{row.sunday}</td>
                        <td>{row.holiday}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
