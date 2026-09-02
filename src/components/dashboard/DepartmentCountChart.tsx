"use client";

import dynamic from "next/dynamic";
import { departmentCountCategories, departmentCountData } from "@/data/dashboard";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function DepartmentCountChart() {
  return (
    <div className="card h-full">
      <div className="card-body">
        <h5 className="card-title mb-4">Employee Count by Department</h5>
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
                horizontal: true,
                borderRadius: 4,
                borderRadiusApplication: "end",
                dataLabels: { position: "top" },
              },
            },
            dataLabels: {
              enabled: true,
              offsetX: 20,
              style: { fontSize: "12px", colors: ["#65688a"] },
            },
            grid: { show: false },
            xaxis: {
              categories: departmentCountCategories,
              axisBorder: { show: false },
              axisTicks: { show: false },
              labels: { show: false },
            },
            yaxis: {
              labels: { style: { colors: "#65688a", fontWeight: 600 } },
            },
            colors: ["#6f5fe0"],
          }}
          series={[{ name: "Employees", data: departmentCountData }]}
        />
      </div>
    </div>
  );
}
