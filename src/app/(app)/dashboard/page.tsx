"use client";

// import { CalendarCheck, MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { AnalyticsStatCard } from "@/components/dashboard/AnalyticsStatCard";
import { analyticsStats } from "@/data/dashboard";

// New Charts
import { BranchCountChart } from "@/components/dashboard/BranchCountChart";
import { DepartmentCountChart } from "@/components/dashboard/DepartmentCountChart";
import { AttendancePercentageChart } from "@/components/dashboard/AttendancePercentageChart";
import { LeaveUtilizationChart } from "@/components/dashboard/LeaveUtilizationChart";
import { PayrollSummaryChart } from "@/components/dashboard/PayrollSummaryChart";

/*
// Previous charts (Commented out for future use)
import { PerformanceBarChart } from "@/components/dashboard/PerformanceBarChart";
import { SatisfactionRadialChart } from "@/components/dashboard/SatisfactionRadialChart";
import { GenderDonutChart } from "@/components/dashboard/GenderDonutChart";
import { PerformanceTable } from "@/components/dashboard/PerformanceTable";
import { EmploymentTypeCard } from "@/components/dashboard/EmploymentTypeCard";
import { LocationCard } from "@/components/dashboard/LocationCard";
import { ActiveEmployeesCard } from "@/components/dashboard/ActiveEmployeesCard";
import {
  highPerformanceEmployees,
  lowPerformanceEmployees,
} from "@/data/dashboard";
*/

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Employee Analytics" section="Dashboard" />
      <div className="container-fluid">
        {/* Row 1: stats + Attendance Percentage */}
        <div className="dash-row mb-4">
          <div className="dash-stats-col">
            <div className="dash-stat-grid">
              {analyticsStats.map((stat, index) => (
                <AnalyticsStatCard key={stat.title} {...stat} iconIndex={index} />
              ))}
            </div>
          </div>
          <div className="dash-chart-col">
            <AttendancePercentageChart />
          </div>
        </div>

        {/* Row 2: Branch Count + Department Count */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <BranchCountChart />
          <DepartmentCountChart />
        </div>

        {/* Row 3: Leave Utilization + Payroll Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LeaveUtilizationChart />
          <PayrollSummaryChart />
        </div>

        {/* 
        // Previous layout structure (Commented out)
        <div className="dash-row mb-4">
          <div className="dash-chart-col w-full">
            <div className="card h-full">
              <div className="card-body pb-0">
                <PerformanceBarChart />
              </div>
            </div>
          </div>
        </div>

        <div className="dash-row mb-4">
          <div className="dash-satisfaction-col">
            <div className="card">
              <div className="card-body">
                <SatisfactionRadialChart />
              </div>
            </div>
          </div>
          <div className="dash-table-col">
            <PerformanceTable
              title="High Performance Employee List"
              rows={highPerformanceEmployees}
            />
          </div>
        </div>

        <div className="dash-row">
          <div className="dash-main-col">
            <div className="dash-inner-row mb-4">
              <div className="dash-half-col">
                <EmploymentTypeCard />
              </div>
              <div className="dash-half-col">
                <LocationCard />
              </div>
            </div>
            <PerformanceTable
              title="Low Performance Employee List"
              rows={lowPerformanceEmployees}
            />
          </div>
          <div className="dash-side-col">
            <div className="mb-4">
              <div className="card">
                <div className="card-body">
                  <GenderDonutChart />
                </div>
              </div>
            </div>
            <ActiveEmployeesCard />
          </div>
        </div>
        */}
      </div>
    </>
  );
}
