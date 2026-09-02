"use client";

import dynamic from "next/dynamic";
import { branchCountCategories, branchCountData } from "@/data/dashboard";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function BranchCountChart() {
  return (
    <div className="card h-full">
      <div className="card-body">
        <h5 className="card-title mb-4">Employee Count by Branch</h5>
        <Chart
          type="bar"
          height={320}
          width="100%"
          options={{
            chart: {
              type: "bar",
              toolbar: { show: false },
              fontFamily: "Nunito, sans-serif",
            },
            plotOptions: {
              bar: {
                columnWidth: "45%",
                borderRadius: 4,
                borderRadiusApplication: "end",
                dataLabels: { position: "top" },
              },
            },
            dataLabels: {
              enabled: true,
              offsetY: -20,
              style: { fontSize: "12px", colors: ["#65688a"] },
            },
            grid: { show: false },
            xaxis: {
              categories: branchCountCategories,
              axisBorder: { show: false },
              axisTicks: { show: false },
            },
            yaxis: {
              show: false,
            },
            colors: ["#4666e1"],
          }}
          series={[{ name: "Employees", data: branchCountData }]}
        />
      </div>
    </div>
  );
}
