"use client";

import dynamic from "next/dynamic";
import { payrollSummaryCategories, payrollSummaryData } from "@/data/dashboard";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function PayrollSummaryChart() {
  return (
    <div className="card h-full">
      <div className="card-body">
        <h5 className="card-title mb-4">Payroll Summary</h5>
        <Chart
          type="line"
          height={320}
          width="100%"
          options={{
            chart: {
              type: "line",
              toolbar: { show: false },
              fontFamily: "Nunito, sans-serif",
            },
            stroke: {
              curve: "smooth",
              width: 3,
            },
            markers: {
              size: 4,
              colors: ["#fff"],
              strokeColors: "#7367f0",
              strokeWidth: 2,
            },
            dataLabels: {
              enabled: false,
            },
            grid: {
              borderColor: "#f1f3fa",
              strokeDashArray: 4,
            },
            xaxis: {
              categories: payrollSummaryCategories,
              axisBorder: { show: false },
              axisTicks: { show: false },
            },
            yaxis: {
              labels: {
                formatter: (val: number) => `$${val.toLocaleString()}`,
                style: { colors: "#65688a", fontWeight: 600 },
              },
            },
            tooltip: {
              y: { formatter: (val: number) => `$${val.toLocaleString()}` },
            },
            colors: ["#7367f0"],
          }}
          series={[{ name: "Total Payroll", data: payrollSummaryData }]}
        />
      </div>
    </div>
  );
}
