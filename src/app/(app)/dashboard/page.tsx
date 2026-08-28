"use client";

import { CalendarCheck, MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { AnalyticsStatCard } from "@/components/dashboard/AnalyticsStatCard";
import { PerformanceBarChart } from "@/components/dashboard/PerformanceBarChart";
import { SatisfactionRadialChart } from "@/components/dashboard/SatisfactionRadialChart";
import { GenderDonutChart } from "@/components/dashboard/GenderDonutChart";
import { PerformanceTable } from "@/components/dashboard/PerformanceTable";
import { EmploymentTypeCard } from "@/components/dashboard/EmploymentTypeCard";
import { LocationCard } from "@/components/dashboard/LocationCard";
import { ActiveEmployeesCard } from "@/components/dashboard/ActiveEmployeesCard";
import {
  analyticsStats,
  highPerformanceEmployees,
  lowPerformanceEmployees,
} from "@/data/dashboard";

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Employee Analytics" section="Dashboard" />
      <div className="container-fluid">
        {/* Row 1: stats + performance chart */}
        <div className="dash-row mb-4">
          <div className="dash-stats-col">
            <div className="dash-stat-grid">
              {analyticsStats.map((stat, index) => (
                <AnalyticsStatCard key={stat.title} {...stat} iconIndex={index} />
              ))}
            </div>
          </div>
          <div className="dash-chart-col">
            <div className="card h-full">
              <div className="card-body pb-0">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h5 className="card-title mb-0">Employee Performance</h5>
                  <div className="input-select-icon">
                    <CalendarCheck size={15} className="input-select-icon-svg" />
                    <select className="form-select-sm" defaultValue="Last Year">
                      <option>Last Year</option>
                      <option>This Month</option>
                      <option>Last Month</option>
                      <option>Last 6 Month</option>
                    </select>
                  </div>
                </div>
                <PerformanceBarChart />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: satisfaction + high performance table */}
        <div className="dash-row mb-4">
          <div className="dash-satisfaction-col">
            <div className="card">
              <div className="card-body">
                <div className="mb-3 flex items-center justify-between">
                  <h5 className="card-title mb-0">Employee Satisfaction</h5>
                  <button type="button" className="card-drop-icon" aria-label="Menu">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
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

        {/* Row 3: left wide + right sidebar */}
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
                  <div className="mb-3 flex items-center justify-between">
                    <h5 className="card-title mb-0">Employee Gender Ratio</h5>
                    <button type="button" className="card-drop-icon" aria-label="Menu">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                  <GenderDonutChart />
                </div>
              </div>
            </div>
            <ActiveEmployeesCard />
          </div>
        </div>
      </div>
    </>
  );
}
